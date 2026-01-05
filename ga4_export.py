#!/usr/bin/env python3
"""
GA4 Event Data Export Script

Pulls usermod_view and usermod_download event data from Google Analytics 4
and exports it to YAML format.

Requirements:
    pip install google-analytics-data pyyaml

Authentication:
    Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account JSON key file path.
    The service account must have Viewer access to the GA4 property.

Usage:
    python ga4_export.py --property-id 123456789
    python ga4_export.py --property-id 123456789 --start-date 30daysAgo --end-date today
"""

import argparse
import json
import os
import yaml
from datetime import date, datetime, timedelta
from typing import Any, Dict, List


def _load_existing_export(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            # Support both YAML and JSON for backward compatibility
            if path.endswith('.yml') or path.endswith('.yaml'):
                data = yaml.safe_load(f)
            else:
                data = json.load(f)
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}


def _resolve_end_date(end_date: str | None) -> str:
    if end_date in (None, "today"):
        return datetime.now().date().isoformat()
    if end_date == "yesterday":
        return (datetime.now().date() - timedelta(days=1)).isoformat()
    return end_date


def _merge_usermod_aggregates(
    existing_usermods: List[Dict[str, Any]],
    new_usermods: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Merge existing and new usermod aggregates by summing their metrics."""
    def key(u: Dict[str, Any]) -> tuple:
        return (
            str(u.get("mod_repository", "")),
            str(u.get("mod_author", "")),
            str(u.get("mod_title", "")),
        )

    fields = [
        "first_time_views",
        "repeat_views",
        "unknown_views",
        "total_views",
        "first_time_downloads",
        "repeat_downloads",
        "unknown_downloads",
        "total_downloads",
    ]

    merged: Dict[tuple, Dict[str, Any]] = {}

    for u in existing_usermods or []:
        merged[key(u)] = dict(u)

    for u in new_usermods or []:
        k = key(u)
        if k not in merged:
            merged[k] = dict(u)
            for f in fields:
                merged[k][f] = int(merged[k].get(f, 0) or 0)
        else:
            for f in fields:
                merged[k][f] = int(merged[k].get(f, 0) or 0) + int(u.get(f, 0) or 0)

    return list(merged.values())


def _try_parse_iso_date(value: str) -> date | None:
    try:
        return datetime.fromisoformat(value[:10]).date()
    except Exception:
        return None


def _resolve_start_date_from_existing(existing: Dict[str, Any]) -> str | None:
    # Prefer a resolved "data_through" date if present
    data_through = existing.get("data_through")
    if isinstance(data_through, str) and len(data_through) >= 10:
        try:
            last = datetime.fromisoformat(data_through[:10]).date()
            return (last + timedelta(days=1)).isoformat()
        except ValueError:
            pass

    exported_at = existing.get("exported_at")
    if isinstance(exported_at, str) and len(exported_at) >= 10:
        try:
            last = datetime.fromisoformat(exported_at[:10]).date()
            return (last + timedelta(days=1)).isoformat()
        except ValueError:
            pass

    return None


def _merge_rows(existing_rows: List[Dict[str, Any]], new_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    def key_for(row: Dict[str, Any]) -> tuple:
        return tuple(sorted((k, str(v)) for k, v in row.items() if k != "event_count"))

    merged: Dict[tuple, Dict[str, Any]] = {}

    for row in existing_rows:
        k = key_for(row)
        merged[k] = dict(row)

    for row in new_rows:
        k = key_for(row)
        if k in merged:
            merged[k]["event_count"] = int(merged[k].get("event_count", 0)) + int(row.get("event_count", 0))
        else:
            merged[k] = dict(row)

    return list(merged.values())


def get_client():
    """Import and return GA4 Data API client."""
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        return BetaAnalyticsDataClient()
    except ImportError:
        raise RuntimeError(
            "Missing dependency. Install with: pip install google-analytics-data"
        )


def get_api_types():
    """Import and return GA4 Data API types."""
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Filter,
        FilterExpression,
        Metric,
        RunReportRequest,
    )
    return DateRange, Dimension, Filter, FilterExpression, Metric, RunReportRequest


def fetch_event_data(
    client,
    property_id: str,
    event_name: str,
    start_date: str,
    end_date: str,
    custom_dimensions: List[str],
    limit: int = 10000,
) -> List[Dict[str, Any]]:
    """Fetch event data for a specific event name."""
    DateRange, Dimension, Filter, FilterExpression, Metric, RunReportRequest = get_api_types()

    # Base dimensions (always available)
    dimensions = ["eventName", "date"]
    
    # Add custom dimensions that are registered in GA4
    for dim in custom_dimensions:
        dimensions.append(f"customEvent:{dim}")

    request = RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        dimensions=[Dimension(name=d) for d in dimensions],
        metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="eventName",
                string_filter=Filter.StringFilter(
                    match_type=Filter.StringFilter.MatchType.EXACT,
                    value=event_name,
                ),
            )
        ),
        limit=limit,
    )

    response = client.run_report(request)
    
    rows = []
    dim_headers = [h.name for h in response.dimension_headers]
    
    for row in response.rows:
        row_data = {}
        for i, dim_value in enumerate(row.dimension_values):
            # Clean up dimension names (remove customEvent: prefix)
            key = dim_headers[i].replace("customEvent:", "")
            row_data[key] = dim_value.value
        row_data["event_count"] = int(row.metric_values[0].value)
        rows.append(row_data)
    
    return rows


def export_ga4_data(
    property_id: str,
    output_path: str,
    start_date: str | None = None,
    end_date: str | None = None,
    custom_dimensions: List[str] = None,
    combine: bool = False,
) -> Dict[str, Any]:
    """Export GA4 usermod event data to JSON."""
    client = get_client()
    
    # Default to mod_title only (the one confirmed to be registered)
    # Add more dimensions here as you register them in GA4 Admin > Custom definitions
    if custom_dimensions is None:
        custom_dimensions = ["mod_title"]
    
    existing = _load_existing_export(output_path)

    # Auto date range behavior:
    # - If output exists, fetch only from the day after the previous export through today.
    # - If output doesn't exist, fetch from GA4's minimum allowed date (2015-08-14).
    if start_date is None:
        start_date = _resolve_start_date_from_existing(existing) or "2026-01-01"
    if end_date is None:
        end_date = "today"

    # GA4 interprets relative dates like "today" in the GA property timezone. If we resume
    # using an ISO date, make the end date ISO too so start/end are comparable.
    resolved_end_date = _resolve_end_date(end_date)
    if end_date == "today":
        end_date = resolved_end_date

    start_iso = _try_parse_iso_date(start_date)
    end_iso = _try_parse_iso_date(resolved_end_date)
    if start_iso is not None and end_iso is not None and start_iso > end_iso:
        if existing:
            existing["exported_at"] = datetime.now().isoformat()
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(existing, f, indent=2, ensure_ascii=False)
            print(f"No new data to export (start_date {start_date} is after end_date {resolved_end_date}).")
            return existing
        output = {
            "exported_at": datetime.now().isoformat(),
            "data_through": resolved_end_date,
            "property_id": property_id,
            "date_range": {"start_date": start_date, "end_date": end_date},
            "usermod_views": {"total_events": 0, "rows": []},
            "usermod_downloads": {"total_events": 0, "rows": []},
        }
        os.makedirs(os.path.dirname(os.path.abspath(output_path)) or ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"No new data to export (start_date {start_date} is after end_date {resolved_end_date}).")
        return output

    # Fetch both event types
    usermod_views = fetch_event_data(
        client, property_id, "usermod_view", start_date, end_date, custom_dimensions
    )
    usermod_downloads = fetch_event_data(
        client, property_id, "usermod_download", start_date, end_date, custom_dimensions
    )

    # Note: --combine is applied after we compute aggregated "usermods" below
    
    # Calculate overall analytics for views
    first_time_views = sum(
        r["event_count"] for r in usermod_views 
        if str(r.get("first_time_view", "")).lower() == "true"
    )
    repeat_views = sum(
        r["event_count"] for r in usermod_views 
        if str(r.get("first_time_view", "")).lower() == "false"
    )
    unknown_views = sum(
        r["event_count"] for r in usermod_views 
        if str(r.get("first_time_view", "")).lower() not in ["true", "false"]
    )
    
    # Calculate per-usermod analytics for views
    usermod_stats = {}
    for row in usermod_views:
        mod_title = row.get("mod_title", "Unknown")
        mod_author = row.get("mod_author", "(not set)")
        mod_repo = row.get("mod_repository", "(not set)")
        first_time = str(row.get("first_time_view", "")).lower()
        count = row.get("event_count", 0)
        
        # Create unique key for this usermod
        key = f"{mod_repo}/{mod_author}/{mod_title}"
        
        if key not in usermod_stats:
            usermod_stats[key] = {
                "mod_title": mod_title,
                "mod_author": mod_author,
                "mod_repository": mod_repo,
                "first_time_views": 0,
                "repeat_views": 0,
                "unknown_views": 0,
                "total_views": 0
            }
        
        if first_time == "true":
            usermod_stats[key]["first_time_views"] += count
        elif first_time == "false":
            usermod_stats[key]["repeat_views"] += count
        else:
            usermod_stats[key]["unknown_views"] += count
        
        usermod_stats[key]["total_views"] += count
    
    # Calculate overall analytics for downloads
    first_time_downloads = sum(
        r["event_count"] for r in usermod_downloads 
        if str(r.get("first_time_download", "")).lower() == "true"
    )
    repeat_downloads = sum(
        r["event_count"] for r in usermod_downloads 
        if str(r.get("first_time_download", "")).lower() == "false"
    )
    unknown_downloads = sum(
        r["event_count"] for r in usermod_downloads 
        if str(r.get("first_time_download", "")).lower() not in ["true", "false"]
    )
    
    # Add download stats to existing usermod_stats
    for row in usermod_downloads:
        mod_title = row.get("mod_title", "Unknown")
        mod_author = row.get("mod_author", "(not set)")
        mod_repo = row.get("mod_repository", "(not set)")
        first_time = str(row.get("first_time_download", "")).lower()
        count = row.get("event_count", 0)
        
        # Create unique key for this usermod
        key = f"{mod_repo}/{mod_author}/{mod_title}"
        
        # Initialize if doesn't exist (usermod with downloads but no views)
        if key not in usermod_stats:
            usermod_stats[key] = {
                "mod_title": mod_title,
                "mod_author": mod_author,
                "mod_repository": mod_repo,
                "first_time_views": 0,
                "repeat_views": 0,
                "unknown_views": 0,
                "total_views": 0,
                "first_time_downloads": 0,
                "repeat_downloads": 0,
                "unknown_downloads": 0,
                "total_downloads": 0
            }
        # Add download fields if they don't exist
        elif "first_time_downloads" not in usermod_stats[key]:
            usermod_stats[key]["first_time_downloads"] = 0
            usermod_stats[key]["repeat_downloads"] = 0
            usermod_stats[key]["unknown_downloads"] = 0
            usermod_stats[key]["total_downloads"] = 0
        
        if first_time == "true":
            usermod_stats[key]["first_time_downloads"] += count
        elif first_time == "false":
            usermod_stats[key]["repeat_downloads"] += count
        else:
            usermod_stats[key]["unknown_downloads"] += count
        
        usermod_stats[key]["total_downloads"] += count
    
    # Ensure all usermods have download fields (even if zero)
    for key in usermod_stats:
        if "first_time_downloads" not in usermod_stats[key]:
            usermod_stats[key]["first_time_downloads"] = 0
            usermod_stats[key]["repeat_downloads"] = 0
            usermod_stats[key]["unknown_downloads"] = 0
            usermod_stats[key]["total_downloads"] = 0
    
    # Convert to list
    combined_usermods = list(usermod_stats.values())

    # If combine is requested, merge with existing aggregated output
    if existing and combine:
        prev_usermods = existing.get("usermods", [])
        if isinstance(prev_usermods, list):
            combined_usermods = _merge_usermod_aggregates(prev_usermods, combined_usermods)

    # Sort by total activity (views + downloads)
    combined_usermods = sorted(
        combined_usermods,
        key=lambda x: int(x.get("total_views", 0) or 0) + int(x.get("total_downloads", 0) or 0),
        reverse=True,
    )
    
    output = {
        "exported_at": datetime.now().isoformat(),
        "data_through": resolved_end_date,
        "property_id": property_id,
        "date_range": {
            "start_date": start_date,
            "end_date": end_date,
        },
        "usermods": combined_usermods,
    }
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)) or ".", exist_ok=True)
    
    # Export as YAML or JSON based on file extension
    with open(output_path, "w", encoding="utf-8") as f:
        if output_path.endswith('.yml') or output_path.endswith('.yaml'):
            yaml.dump(output, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        else:
            json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(usermod_views)} view records and {len(usermod_downloads)} download records to {output_path}")
    
    return output


def main():
    parser = argparse.ArgumentParser(
        description="Export GA4 usermod event data to JSON"
    )
    parser.add_argument(
        "--property-id",
        required=True,
        help="GA4 property ID (numeric, e.g. 123456789). Find this in GA4 Admin > Property Settings.",
    )
    parser.add_argument(
        "--output",
        default="data/ga4_usermods.yml",
        help="Output file path (default: data/ga4_usermods.yml). Supports .yml, .yaml, or .json",
    )
    parser.add_argument(
        "--start-date",
        default=None,
        help=(
            "Start date (YYYY-MM-DD or relative). If omitted and the output JSON exists, "
            "the script resumes from the day after the previous export. If omitted and no output exists, "
            "it fetches from a very early date."
        ),
    )
    parser.add_argument(
        "--end-date",
        default=None,
        help="End date (YYYY-MM-DD or relative). If omitted, defaults to today.",
    )
    parser.add_argument(
        "--dimensions",
        nargs="*",
        default=["mod_title", "mod_author", "mod_repository", "first_time_view"],
        help=(
            "Custom event dimensions to include (without 'customEvent:' prefix). "
            "These must be registered in GA4 Admin > Custom definitions. "
            "Default: mod_title mod_author mod_repository first_time_view"
        ),
    )
    parser.add_argument(
        "--combine",
        action="store_true",
        help=(
            "Combine new data with existing data in the output file. "
            "If not specified, the output file will be replaced with only new data."
        ),
    )
    
    args = parser.parse_args()
    
    export_ga4_data(
        property_id=args.property_id,
        output_path=args.output,
        start_date=args.start_date,
        end_date=args.end_date,
        custom_dimensions=args.dimensions,
        combine=args.combine,
    )


if __name__ == "__main__":
    main()
