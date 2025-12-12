#!/usr/bin/env python3
"""
DraftShift UserMods Data Collection Script

Collects usermod data from DraftShift GitHub repositories:
- List of repositories
- Users with mods in each repository
- List of mods for each user
"""

import re
import requests
import yaml
import os
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict, field
from datetime import datetime
from urllib.parse import quote

# List of repositories to scan for usermods
repos = ["StealthChanger", "ModularDock", "Tophat", "DoorBuffer", "CableManagement"]

# Image extensions to look for when scanning for thumbnails
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}
# Extensions to look for when scanning for CAD files
CAD_EXTENSIONS = {'.step', '.stp', '.f3d', '.f3z', '.sldprt', '.obj'}
# Extensions to look for when scanning for code files
CODE_EXTENSIONS = {'.py', '.js', '.ts', '.sh', '.bash', '.ps1', '.cfg', '.yaml', '.yml', '.json', '.xml', '.html', '.css', '.c', '.cpp', '.h', '.rs', '.go', '.rb', '.pl', '.lua'}

@dataclass
class Mod:
    """Represents a single usermod"""
    name: str
    path: str
    title: Optional[str] = None
    url: Optional[str] = None
    created_commit: Optional[str] = None
    created_date: Optional[str] = None
    has_readme: bool = False
    readme_data: Optional[str] = None
    thumbnail: Optional[str] = None
    images: List[str] = field(default_factory=list)
    stls: List[str] = field(default_factory=list)
    cads: List[str] = field(default_factory=list)
    code: List[str] = field(default_factory=list)


@dataclass
class User:
    """Represents a user with their mods"""
    username: str
    mods: List[Mod]


@dataclass
class Repository:
    """Represents a repository with its users and mods"""
    name: str
    url: str
    has_usermods: bool
    users: List[User]
    head_commit: Optional[str] = None  # Current commit SHA when scanned
    last_scanned: Optional[str] = None  # When this repo was last fully scanned


@dataclass
class DraftShiftData:
    """Complete data structure for DraftShift usermods"""
    collected_at: str
    organization: str
    repositories: List[Repository]


class DraftShiftCollector:
    """Collects usermod data from DraftShift GitHub organization"""
    
    def __init__(self, github_token: Optional[str] = None):
        """
        Initialize the collector.
        
        Args:
            github_token: Optional GitHub personal access token for higher rate limits
        """
        self.org_name = "DraftShift"
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        if github_token:
            self.headers["Authorization"] = f"Bearer {github_token}"
        self.api_calls = 0  # Track API usage
        self.raw_base_url = "https://raw.githubusercontent.com"
        self.cache_file = "data/usermods.yml"
        self.cached_data: Optional[Dict] = None
        self._load_cache()
    
    def _load_cache(self):
        """Load cached data from YAML file if it exists"""
        if Path(self.cache_file).exists():
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    self.cached_data = yaml.safe_load(f)
                print(f"Loaded cache from {self.cache_file}")
            except (yaml.YAMLError, IOError):
                self.cached_data = None
    
    
    def get_cached_repo(self, repo_name: str) -> Optional[Dict]:
        """Get cached repository data if available"""
        if not self.cached_data:
            return None
        for repo in self.cached_data.get("repositories", []):
            if repo.get("name") == repo_name:
                return repo
        return None
    
    def _get(self, url: str, params: Dict = None) -> requests.Response:
        """Make a GET request and track API calls"""
        self.api_calls += 1
        return requests.get(url, headers=self.headers, params=params)
    
    def check_rate_limit(self):
        """Check and display current rate limit status"""
        response = self._get(f"{self.base_url}/rate_limit")
        if response.status_code == 200:
            data = response.json()
            core = data.get("resources", {}).get("core", {})
            remaining = core.get("remaining", 0)
            limit = core.get("limit", 60)
            reset_time = datetime.fromtimestamp(core.get("reset", 0))
            print(f"Rate limit: {remaining}/{limit} remaining (resets at {reset_time.strftime('%H:%M:%S')})")
            return remaining
        return 0
    
    def get_repo_tree(self, repo_name: str, default_branch: str) -> tuple[List[Dict], Optional[str]]:
        """
        Get entire repository tree in ONE API call using Git Trees API.
        This is much more efficient than multiple contents API calls.
        Returns tuple of (tree, sha) where sha is the commit SHA.
        """
        url = f"{self.base_url}/repos/{self.org_name}/{repo_name}/git/trees/{default_branch}?recursive=1"
        response = self._get(url)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("tree", []), data.get("sha")
        return [], None
    
    def get_first_commits_for_paths(self, repo_name: str, paths: List[str]) -> Dict[str, Dict]:
        """
        Get first commit info for multiple paths efficiently.
        Uses ONE API call to get all commits, then filters locally.
        Returns dict mapping path -> {sha, date}
        """
        # Get all commits for UserMods directory in one call (with pagination)
        url = f"{self.base_url}/repos/{self.org_name}/{repo_name}/commits"
        all_commits = []
        page = 1
        
        while True:
            response = self._get(url, {"path": "UserMods", "per_page": 100, "page": page})
            if response.status_code != 200:
                break
            commits = response.json()
            if not commits:
                break
            all_commits.extend(commits)
            page += 1
            # Safety limit
            if page > 20:
                break
        
        # Build a map of path -> earliest commit that touched it
        # Process commits from oldest to newest (reverse order)
        path_commits = {}
        
        for commit in reversed(all_commits):
            sha = commit["sha"]
            date = commit["commit"]["committer"]["date"]
            message = commit["commit"]["message"].lower()
            
            # Check which paths this commit might have introduced
            for path in paths:
                if path not in path_commits:
                    # Check if commit message mentions this path or user
                    # This is a heuristic - the oldest commit touching UserMods
                    # that mentions this path is likely the creation commit
                    path_parts = path.split("/")
                    if len(path_parts) >= 3:
                        username = path_parts[1].lower()
                        modname = path_parts[2].lower()
                        if username in message or modname in message:
                            path_commits[path] = {"sha": sha, "date": date}
        
        # For any paths we couldn't match, use the oldest commit as fallback
        if all_commits:
            oldest = all_commits[-1]
            oldest_info = {"sha": oldest["sha"], "date": oldest["commit"]["committer"]["date"]}
            for path in paths:
                if path not in path_commits:
                    path_commits[path] = oldest_info
        
        return path_commits
    
    def get_readme_content(self, repo_name: str, mod_path: str, default_branch: str = "main") -> Optional[str]:
        """
        Fetch README.md or readme.md content directly from raw.githubusercontent.com.
        This does NOT count against API rate limits.
        Converts relative image URLs to absolute URLs.
        """
        # Try both README.md and readme.md
        for readme_name in ["README.md", "readme.md"]:
            readme_url = f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{mod_path}/{readme_name}"
            try:
                response = requests.get(readme_url, timeout=10)
                if response.status_code == 200:
                    content = response.text
                    return self._process_readme_images(content, repo_name, mod_path, default_branch)
            except requests.RequestException:
                pass
        return None
    
    def _process_readme_images(self, readme_data: str, repo_name: str, mod_path: str, default_branch: str) -> str:
        """
        Replace all relative image URLs in README with absolute URLs.
        Handles both markdown ![alt](url) and HTML <img src="url"> formats.
        """
        def replace_md_image(match):
            prefix = match.group(1)  # ![alt](
            url = match.group(2)
            suffix = match.group(3)  # optional title and )
            absolute_url = self._normalize_image_url(url, repo_name, mod_path, default_branch)
            return f"{prefix}{absolute_url}{suffix}"
        
        def replace_html_image(match):
            prefix = match.group(1)  # <img ... src="
            url = match.group(2)
            suffix = match.group(3)  # " ...>
            absolute_url = self._normalize_image_url(url, repo_name, mod_path, default_branch)
            return f"{prefix}{absolute_url}{suffix}"
        
        # Replace markdown images: ![alt](url) or ![alt](url "title")
        readme_data = re.sub(
            r'(!\[[^\]]*\]\()([^)\s]+)([^)]*\))',
            replace_md_image,
            readme_data
        )
        
        # Replace HTML images: <img src="url" or <img src='url'
        readme_data = re.sub(
            r'(<img[^>]+src=["\'])([^"\']+)(["\'][^>]*>)',
            replace_html_image,
            readme_data,
            flags=re.IGNORECASE
        )
        
        return readme_data
    
    def extract_thumbnail_from_readme(self, readme_data: str, repo_name: str, mod_path: str, default_branch: str) -> Optional[str]:
        """
        Extract the first image URL from README content.
        Checks for markdown images ![alt](url) and HTML <img src="url">.
        Converts relative paths to absolute raw.githubusercontent.com URLs.
        """
        if not readme_data:
            return None
        
        # Pattern for markdown images: ![alt](url) or ![alt](url "title") or ![alt](<url with spaces>)
        # First try angle bracket syntax for URLs with spaces
        md_angle_pattern = r'!\[[^\]]*\]\(<([^>]+)>\)'
        # Then try standard syntax
        md_pattern = r'!\[[^\]]*\]\(([^)\s]+)'
        # Pattern for HTML images: <img src="url" or <img src='url'
        html_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
        
        # Try markdown angle brackets first (for URLs with spaces), then standard markdown, then HTML
        for pattern in [md_angle_pattern, md_pattern, html_pattern]:
            match = re.search(pattern, readme_data, re.IGNORECASE)
            if match:
                url = match.group(1)
                return self._normalize_image_url(url, repo_name, mod_path, default_branch)
        
        return None
    
    def _normalize_image_url(self, url: str, repo_name: str, mod_path: str, default_branch: str) -> str:
        """
        Convert a potentially relative image URL to an absolute raw.githubusercontent.com URL.
        URL encodes the path components to handle spaces and special characters.
        Strips redundant ?raw=true parameter from raw.githubusercontent.com URLs.
        """
        # Already absolute URL
        if url.startswith('http://') or url.startswith('https://'):
            # Strip ?raw=true from raw.githubusercontent.com URLs (it's redundant)
            # Handle both encoded (%3Fraw%3Dtrue) and unencoded (?raw=true) versions
            if 'raw.githubusercontent.com' in url:
                url = url.replace('%3Fraw%3Dtrue', '')
                url = url.replace('%3fraw%3dtrue', '')  # lowercase variant
                url = url.replace('?raw=true', '')
            return url
        
        # Remove leading ./ if present
        if url.startswith('./'):
            url = url[2:]
        
        # URL encode the path (encode spaces and special chars, but preserve /)
        encoded_url = quote(url, safe='/')
        
        # Handle relative paths
        if url.startswith('/'):
            # Absolute path from repo root
            return f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}{encoded_url}"
        else:
            # Relative to mod folder - also encode mod_path
            encoded_mod_path = quote(mod_path, safe='/')
            return f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{encoded_mod_path}/{encoded_url}"
    
    def extract_title_from_readme(self, readme_data: Optional[str]) -> Optional[str]:
        """
        Extract the first markdown title (# Title) from README content.
        Returns None if no title found.
        """
        if not readme_data:
            return None
        
        # Look for # Title at the start of a line
        match = re.search(r'^#\s+(.+)$', readme_data, re.MULTILINE)
        if match:
            return match.group(1).strip()
        return None
    
    def format_name_as_title(self, name: str) -> str:
        """
        Format a mod folder name as a readable title.
        - Replaces underscores with spaces
        - Splits camelCase into separate words
        """
        # Replace underscores with spaces
        title = name.replace('_', ' ')
        
        # Split camelCase: insert space before uppercase letters that follow lowercase
        title = re.sub(r'([a-z])([A-Z])', r'\1 \2', title)
        
        # Also handle cases like "XMLParser" -> "XML Parser"
        title = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', title)
        
        return title
    
    def get_mod_title(self, name: str, readme_data: Optional[str]) -> str:
        """
        Get the title for a mod.
        Priority: README title > formatted name
        """
        readme_title = self.extract_title_from_readme(readme_data)
        if readme_title:
            return readme_title
        return self.format_name_as_title(name)
    
    def find_all_images_in_mod(self, tree: List[Dict], mod_path: str, repo_name: str, default_branch: str) -> List[str]:
        """
        Find all image files in a mod's directory from the tree.
        Returns list of absolute raw URLs to all images.
        No API calls needed - uses already-fetched tree data.
        """
        images = []
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            
            # Check if this is a file in the mod directory (including subdirectories)
            if item_type == "blob" and path.startswith(mod_path + "/"):
                # Check if it's an image
                ext = os.path.splitext(path)[1].lower()
                if ext in IMAGE_EXTENSIONS:
                    encoded_path = quote(path, safe='/')
                    images.append(f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{encoded_path}")
        
        return images
    
    def find_all_stls_in_mod(self, tree: List[Dict], mod_path: str, repo_name: str, default_branch: str) -> List[str]:
        """
        Find all .stl/.3mf files in a mod's directory from the tree.
        Returns list of absolute raw URLs to all STL files.
        No API calls needed - uses already-fetched tree data.
        """
        stls = []
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            
            # Check if this is a file in the mod directory (including subdirectories)
            if item_type == "blob" and path.startswith(mod_path + "/"):
                if path.lower().endswith(".stl") or path.lower().endswith(".3mf"):
                    encoded_path = quote(path, safe='/')
                    stls.append(f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{encoded_path}")
        
        return stls
    
    def find_all_cads_in_mod(self, tree: List[Dict], mod_path: str, repo_name: str, default_branch: str) -> List[str]:
        """
        Find all CAD files in a mod's directory from the tree.
        Priority: files in CAD folder, otherwise CAD_EXTENSION files anywhere.
        Returns list of absolute raw URLs to all CAD files.
        No API calls needed - uses already-fetched tree data.
        """
        cad_folder_path = f"{mod_path}/CAD"
        
        # First check if CAD folder exists and has files
        cad_folder_files = []
        other_cad_files = []
        
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            
            if item_type == "blob" and path.startswith(mod_path + "/"):
                # Check if file is in CAD folder
                if path.startswith(cad_folder_path + "/"):
                    encoded_path = quote(path, safe='/')
                    cad_folder_files.append(f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{encoded_path}")
                else:
                    # Check if it's a CAD file by extension
                    ext = os.path.splitext(path)[1].lower()
                    if ext in CAD_EXTENSIONS:
                        encoded_path = quote(path, safe='/')
                        other_cad_files.append(f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{encoded_path}")
        
        # Return CAD folder contents if it exists, otherwise return CAD files found elsewhere
        return cad_folder_files if cad_folder_files else other_cad_files
    
    def find_all_code_in_mod(self, tree: List[Dict], mod_path: str, repo_name: str, default_branch: str) -> List[str]:
        """
        Find all code files in a mod's directory from the tree.
        Returns list of absolute raw URLs to all code files.
        No API calls needed - uses already-fetched tree data.
        """
        code_files = []
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            
            # Check if this is a file in the mod directory (including subdirectories)
            if item_type == "blob" and path.startswith(mod_path + "/"):
                ext = os.path.splitext(path)[1].lower()
                if ext in CODE_EXTENSIONS:
                    encoded_path = quote(path, safe='/')
                    code_files.append(f"{self.raw_base_url}/{self.org_name}/{repo_name}/{default_branch}/{encoded_path}")
        
        return code_files
    
    def find_first_image_in_mod(self, tree: List[Dict], mod_path: str, repo_name: str, default_branch: str) -> Optional[str]:
        """
        Find the first image file in a mod's directory from the tree.
        Returns absolute raw URL to the image, or None if no images found.
        No API calls needed - uses already-fetched tree data.
        """
        images = self.find_all_images_in_mod(tree, mod_path, repo_name, default_branch)
        return images[0] if images else None
    
    def get_thumbnail(self, readme_data: Optional[str], tree: List[Dict], repo_name: str, mod_path: str, default_branch: str, mod_images: List[str] = None) -> Optional[str]:
        """
        Get thumbnail URL for a mod.
        Priority:
        1. First image in README that exists in the mod's images list
        2. First image file found in mod directory
        """
        # Try README first, but validate it's actually in the mod directory
        if readme_data:
            thumbnail = self.extract_thumbnail_from_readme(readme_data, repo_name, mod_path, default_branch)
            if thumbnail:
                # Only use README thumbnail if it's in the mod's images list
                if mod_images is None:
                    mod_images = self.find_all_images_in_mod(tree, mod_path, repo_name, default_branch)
                if thumbnail in mod_images:
                    return thumbnail
        
        # Fall back to first image in mod directory
        return self.find_first_image_in_mod(tree, mod_path, repo_name, default_branch)
    
    def find_mods_with_readme(self, tree: List[Dict]) -> set:
        """
        Scan tree to find which mod paths have a README.md or readme.md file.
        Returns set of mod paths that have a readme.
        """
        readme_paths = set()
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            # Look for README.md or readme.md files in mod directories
            if item_type == "blob" and path.startswith("UserMods/"):
                filename = path.split("/")[-1].lower()
                if filename == "readme.md":
                    parts = path.split("/")
                    if len(parts) == 4:  # UserMods/username/modname/readme.md
                        mod_path = "/".join(parts[:3])
                        readme_paths.add(mod_path)
        return readme_paths
    
    def collect_usermods_from_tree(self, repo_name: str, tree: List[Dict], default_branch: str = "main") -> List[User]:
        """
        Extract usermods from a pre-fetched repository tree.
        No additional API calls needed for directory structure.
        """
        # Find all UserMods entries
        usermods = {}
        mod_paths = []
        
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            
            # Match pattern: UserMods/username/modname
            if path.startswith("UserMods/") and item_type == "tree":
                parts = path.split("/")
                if len(parts) == 3:  # UserMods/username/modname
                    username = parts[1]
                    modname = parts[2]
                    
                    if username not in usermods:
                        usermods[username] = []
                    
                    usermods[username].append({
                        "name": modname,
                        "path": path
                    })
                    mod_paths.append(path)
        
        # Get commit info for all mod paths (batched)
        print(f"    Getting commit history for {len(mod_paths)} mods...")
        path_commits = self.get_first_commits_for_paths(repo_name, mod_paths) if mod_paths else {}
        
        # Find which mods have README.md (from tree, no API call)
        mods_with_readme = self.find_mods_with_readme(tree)
        print(f"    Found {len(mods_with_readme)} mods with README.md, fetching content...")
        
        # Build User objects
        users = []
        for username, mods_data in sorted(usermods.items()):
            mods = []
            for mod_data in mods_data:
                mod_path = mod_data["path"]
                commit_info = path_commits.get(mod_path, {})
                has_readme = mod_path in mods_with_readme
                readme_data = None
                
                if has_readme:
                    readme_data = self.get_readme_content(repo_name, mod_path, default_branch)
                
                # Get all images in mod folder
                images = self.find_all_images_in_mod(tree, mod_path, repo_name, default_branch)
                
                # Get all STL files in mod folder
                stls = self.find_all_stls_in_mod(tree, mod_path, repo_name, default_branch)
                
                # Get all CAD files in mod folder
                cads = self.find_all_cads_in_mod(tree, mod_path, repo_name, default_branch)
                
                # Get all code files in mod folder
                code = self.find_all_code_in_mod(tree, mod_path, repo_name, default_branch)
                
                # Get thumbnail (from README or first image in mod folder)
                thumbnail = self.get_thumbnail(readme_data, tree, repo_name, mod_path, default_branch, images)
                
                # Get title (from README or formatted name)
                title = self.get_mod_title(mod_data["name"], readme_data)
                
                mod_url = f"https://github.com/{self.org_name}/{repo_name}/tree/{default_branch}/{quote(mod_path, safe='/')}"
                mods.append(Mod(
                    name=mod_data["name"],
                    path=mod_path,
                    title=title,
                    url=mod_url,
                    created_commit=commit_info.get("sha"),
                    created_date=commit_info.get("date"),
                    has_readme=has_readme,
                    readme_data=readme_data,
                    thumbnail=thumbnail,
                    images=images,
                    stls=stls,
                    cads=cads,
                    code=code
                ))
            if mods:
                users.append(User(username=username, mods=mods))
        
        return users
    
    def get_changed_paths(self, repo_name: str, base_commit: str, head_commit: str) -> set:
        """
        Get the set of file paths that changed between two commits.
        Uses Compare Commits API - single call to get all changed files.
        Returns set of paths under UserMods/ that were modified.
        """
        url = f"{self.base_url}/repos/{self.org_name}/{repo_name}/compare/{base_commit}...{head_commit}"
        response = self._get(url)
        
        changed_mod_paths = set()
        if response.status_code == 200:
            data = response.json()
            for file in data.get("files", []):
                filename = file.get("filename", "")
                # Check if this file is under UserMods/
                if filename.startswith("UserMods/"):
                    parts = filename.split("/")
                    if len(parts) >= 3:
                        # Extract the mod path: UserMods/username/modname
                        mod_path = "/".join(parts[:3])
                        changed_mod_paths.add(mod_path)
        
        return changed_mod_paths
    
    def merge_cached_users_with_changes(
        self, 
        repo_name: str, 
        tree: List[Dict], 
        cached_users: List[Dict],
        changed_mod_paths: set,
        default_branch: str = "main"
    ) -> List[User]:
        """
        Merge cached user/mod data with updates for changed mods only.
        - Unchanged mods: use cached data
        - Changed/new mods: fetch fresh commit info and README
        - Deleted mods: removed from result
        """
        # Build set of all current mod paths from tree
        current_mods = {}  # path -> {name, username}
        for item in tree:
            path = item.get("path", "")
            item_type = item.get("type", "")
            if path.startswith("UserMods/") and item_type == "tree":
                parts = path.split("/")
                if len(parts) == 3:
                    current_mods[path] = {"name": parts[2], "username": parts[1]}
        
        # Build cache lookup: path -> mod data
        cached_mods = {}
        for user in cached_users:
            for mod in user.get("mods", []):
                cached_mods[mod["path"]] = mod
        
        # Determine which mods need fresh data
        mods_needing_update = []
        for path in current_mods:
            if path in changed_mod_paths or path not in cached_mods:
                mods_needing_update.append(path)
        
        # Fetch commit info only for changed/new mods
        if mods_needing_update:
            print(f"    Fetching commit info for {len(mods_needing_update)} changed/new mods...")
            fresh_commits = self.get_first_commits_for_paths(repo_name, mods_needing_update)
        else:
            fresh_commits = {}
        
        # Find which mods have README.md (from tree)
        mods_with_readme = self.find_mods_with_readme(tree)
        
        # Build final user list
        usermods = {}
        for path, info in current_mods.items():
            username = info["username"]
            modname = info["name"]
            
            if username not in usermods:
                usermods[username] = []
            
            has_readme = path in mods_with_readme
            
            if path in mods_needing_update:
                # Use fresh data
                commit_info = fresh_commits.get(path, {})
                readme_data = self.get_readme_content(repo_name, path, default_branch) if has_readme else None
                images = self.find_all_images_in_mod(tree, path, repo_name, default_branch)
                stls = self.find_all_stls_in_mod(tree, path, repo_name, default_branch)
                cads = self.find_all_cads_in_mod(tree, path, repo_name, default_branch)
                code = self.find_all_code_in_mod(tree, path, repo_name, default_branch)
                thumbnail = self.get_thumbnail(readme_data, tree, repo_name, path, default_branch, images)
                title = self.get_mod_title(modname, readme_data)
                mod_url = f"https://github.com/{self.org_name}/{repo_name}/tree/{default_branch}/{quote(path, safe='/')}"
                usermods[username].append(Mod(
                    name=modname,
                    path=path,
                    title=title,
                    url=mod_url,
                    created_commit=commit_info.get("sha"),
                    created_date=commit_info.get("date"),
                    has_readme=has_readme,
                    readme_data=readme_data,
                    thumbnail=thumbnail,
                    images=images,
                    stls=stls,
                    cads=cads,
                    code=code
                ))
            else:
                # Use cached data
                cached = cached_mods[path]
                # Check if README status changed
                cached_has_readme = cached.get("has_readme", False)
                if has_readme and not cached_has_readme:
                    # README was added - fetch it
                    readme_data = self.get_readme_content(repo_name, path, default_branch)
                    # Get fresh images, stls, cads, and code list
                    images = self.find_all_images_in_mod(tree, path, repo_name, default_branch)
                    # Also need to get thumbnail since README changed
                    thumbnail = self.get_thumbnail(readme_data, tree, repo_name, path, default_branch, images)
                    stls = self.find_all_stls_in_mod(tree, path, repo_name, default_branch)
                    cads = self.find_all_cads_in_mod(tree, path, repo_name, default_branch)
                    code = self.find_all_code_in_mod(tree, path, repo_name, default_branch)
                elif has_readme and cached_has_readme:
                    # README exists and was cached - use cached
                    readme_data = cached.get("readme_data")
                    thumbnail = cached.get("thumbnail")
                    images = cached.get("images", [])
                    stls = cached.get("stls", [])
                    cads = cached.get("cads", [])
                    code = cached.get("code", [])
                else:
                    readme_data = None
                    # No README, try to get thumbnail from images in folder
                    # Use cached if available, otherwise scan tree
                    thumbnail = cached.get("thumbnail") or self.find_first_image_in_mod(tree, path, repo_name, default_branch)
                    images = cached.get("images", [])
                    stls = cached.get("stls", [])
                    cads = cached.get("cads", [])
                    code = cached.get("code", [])
                
                mod_url = cached.get("url") or f"https://github.com/{self.org_name}/{repo_name}/tree/{default_branch}/{quote(path, safe='/')}"
                title = cached.get("title") or self.get_mod_title(cached["name"], readme_data)
                usermods[username].append(Mod(
                    name=cached["name"],
                    path=cached["path"],
                    title=title,
                    url=mod_url,
                    created_commit=cached.get("created_commit"),
                    created_date=cached.get("created_date"),
                    has_readme=has_readme,
                    readme_data=readme_data,
                    thumbnail=thumbnail,
                    images=images,
                    stls=stls,
                    cads=cads,
                    code=code
                ))
        
        # Build User objects
        users = []
        for username, mods in sorted(usermods.items()):
            if mods:
                users.append(User(username=username, mods=mods))
        
        return users
    
    def collect_all_data(self) -> DraftShiftData:
        """
        Collect all usermod data from DraftShift organization.
        
        API calls are minimized:
        - 1 tree call per repo (also provides HEAD SHA for cache check)
        - For changed repos with cache: 1 compare call
        - Only fetch commit history for new/changed mods
        """
        print(f"Scanning {len(repos)} repositories from {self.org_name}...")
        
        repositories = []
        stats = {"cached": 0, "incremental": 0, "full": 0}
        
        for repo_name in repos:
            default_branch = "main"  # Assume main branch for all repos
            print(f"\nChecking {repo_name}...", end=" ")
            
            cached_repo = self.get_cached_repo(repo_name)
            cached_head = cached_repo.get("head_commit") if cached_repo else None
            
            # Get the tree (also gives us current HEAD SHA)
            tree, head_commit = self.get_repo_tree(repo_name, default_branch)
            has_usermods = any(item.get("path") == "UserMods" for item in tree)
            
            # Case 1: No changes - use fully cached data
            if cached_repo and cached_head == head_commit and head_commit:
                print("[CACHED] No changes")
                repo_url = cached_repo["url"]
                users = [
                    User(
                        username=u["username"],
                        mods=[Mod(**{
                            **m,
                            "url": m.get("url") or f"{repo_url}/tree/{default_branch}/{m['path']}",
                            "title": m.get("title") or self.get_mod_title(m["name"], m.get("readme_data"))
                        }) for m in u["mods"]]
                    )
                    for u in cached_repo.get("users", [])
                ]
                repositories.append(Repository(
                    name=cached_repo["name"],
                    url=cached_repo["url"],
                    has_usermods=cached_repo["has_usermods"],
                    users=users,
                    head_commit=head_commit,
                    last_scanned=cached_repo.get("last_scanned")
                ))
                stats["cached"] += 1
                continue
            
            # Case 2: Has cache but changed - do incremental update
            if cached_repo and cached_head and head_commit and has_usermods and cached_repo.get("has_usermods"):
                print("[INCREMENTAL] Checking changes...")
                changed_paths = self.get_changed_paths(repo_name, cached_head, head_commit)
                usermod_changes = {p for p in changed_paths if p.startswith("UserMods/")}
                
                if not usermod_changes:
                    # Changes were outside UserMods - use cached user data
                    print("    No UserMods changes, using cached mod data")
                    repo_url = f"https://github.com/{self.org_name}/{repo_name}"
                    users = [
                        User(
                            username=u["username"],
                            mods=[Mod(**{
                                **m,
                                "url": m.get("url") or f"{repo_url}/tree/{default_branch}/{m['path']}",
                                "title": m.get("title") or self.get_mod_title(m["name"], m.get("readme_data"))
                            }) for m in u["mods"]]
                        )
                        for u in cached_repo.get("users", [])
                    ]
                else:
                    print(f"    {len(usermod_changes)} mod(s) changed")
                    users = self.merge_cached_users_with_changes(
                        repo_name, tree, cached_repo.get("users", []), usermod_changes, default_branch
                    )
                
                print(f"  Found {len(users)} users with {sum(len(u.mods) for u in users)} total mods")
                repo_url = f"https://github.com/{self.org_name}/{repo_name}"
                repositories.append(Repository(
                    name=repo_name,
                    url=repo_url,
                    has_usermods=True,
                    users=users,
                    head_commit=head_commit,
                    last_scanned=datetime.now().isoformat()
                ))
                stats["incremental"] += 1
                continue
            
            # Case 3: No cache or new repo - full scan
            if has_usermods:
                print("[FULL SCAN] Has UserMods folder")
                print(f"  Collecting usermods from {repo_name}...")
                users = self.collect_usermods_from_tree(repo_name, tree, default_branch)
                print(f"  Found {len(users)} users with {sum(len(u.mods) for u in users)} total mods")
            else:
                print("[NO] No UserMods folder")
                users = []
            
            repo_url = f"https://github.com/{self.org_name}/{repo_name}"
            repositories.append(Repository(
                name=repo_name,
                url=repo_url,
                has_usermods=has_usermods,
                users=users,
                head_commit=head_commit,
                last_scanned=datetime.now().isoformat()
            ))
            stats["full"] += 1
        
        print(f"\nScan stats: {stats['cached']} cached, {stats['incremental']} incremental, {stats['full']} full")
        
        return DraftShiftData(
            collected_at=datetime.now().isoformat(),
            organization=self.org_name,
            repositories=repositories
        )
    
    def save_to_yaml(self, data: DraftShiftData, filename: str = "data/usermods.yml"):
        """Save collected data to YAML file"""
        with open(filename, "w", encoding="utf-8") as f:
            yaml.dump(asdict(data), f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        print(f"\nData saved to {filename}")
    
    def print_summary(self, data: DraftShiftData):
        """Print a summary of collected data"""
        print("\n" + "="*60)
        print("COLLECTION SUMMARY")
        print("="*60)
        print(f"Organization: {data.organization}")
        print(f"Collected at: {data.collected_at}")
        print(f"Total repositories: {len(data.repositories)}")
        
        repos_with_mods = [r for r in data.repositories if r.has_usermods]
        print(f"Repositories with UserMods: {len(repos_with_mods)}")
        
        print("\nRepositories with UserMods:")
        for repo in repos_with_mods:
            total_mods = sum(len(u.mods) for u in repo.users)
            scanned = repo.last_scanned[:10] if repo.last_scanned else "unknown"
            print(f"  - {repo.name}: {len(repo.users)} users, {total_mods} mods (scanned: {scanned})")
            for user in repo.users:
                print(f"    * {user.username}: {len(user.mods)} mod(s)")
                for mod in user.mods:
                    date_str = mod.created_date[:10] if mod.created_date else "unknown"
                    indicators = []
                    if mod.has_readme:
                        indicators.append("README")
                    if mod.images:
                        indicators.append(f"{len(mod.images)} imgs")
                    if mod.stls:
                        indicators.append(f"{len(mod.stls)} stls")
                    if mod.cads:
                        indicators.append(f"{len(mod.cads)} cads")
                    if mod.code:
                        indicators.append(f"{len(mod.code)} code")
                    indicator_str = f" [{', '.join(indicators)}]" if indicators else ""
                    print(f"      + {mod.name} (created: {date_str}){indicator_str}")
        print("="*60)


def main():
    """
    Main function to run the data collection.
    
    Usage:
        python usermods.py
        
    For higher rate limits, set GITHUB_TOKEN environment variable:
        export GITHUB_TOKEN=your_token_here  # Linux/Mac
        set GITHUB_TOKEN=your_token_here     # Windows
    """
    # Get GitHub token from environment if available
    github_token = os.environ.get("GITHUB_TOKEN")
    
    if github_token:
        print("Using GitHub token for authentication")
    else:
        print("No GitHub token found. Using unauthenticated requests.")
        print("Rate limit: 60 requests/hour")
        print("To increase rate limit, set GITHUB_TOKEN environment variable.\n")
    
    try:
        collector = DraftShiftCollector(github_token=github_token)
        
        # Check rate limit before starting
        remaining = collector.check_rate_limit()
        if remaining < 15:
            print(f"\nWarning: Only {remaining} API calls remaining. Consider waiting for reset.")
            return 1
        
        data = collector.collect_all_data()
        
        # Save to YAML
        collector.save_to_yaml(data)
        
        # Print summary
        collector.print_summary(data)
        
        # Show API usage
        print(f"\nTotal API calls made: {collector.api_calls}")
        
    except requests.exceptions.RequestException as e:
        print(f"\nError: Failed to fetch data from GitHub API")
        print(f"Details: {e}")
        return 1
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())