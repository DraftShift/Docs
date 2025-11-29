"""
MkDocs hook to dynamically generate navigation for hardware guides.
This scans the guides folder structure and builds the nav automatically.
"""

import os
import yaml
import re


def extract_index(folder_name):
    """Extract the numeric index from a folder name like '1_name' or '01_name'"""
    match = re.match(r'^(\d+)_', folder_name)
    if match:
        return int(match.group(1))
    return 999  # Put non-indexed items at the end


def get_guide_title(guide_path):
    """Read the title from a guide's data.yml file"""
    data_file = os.path.join(guide_path, 'data.yml')
    if os.path.exists(data_file):
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                return data.get('title', None)
        except Exception as e:
            print(f"Warning: Could not read title from {data_file}: {e}")
    return None


def generate_guides_nav(guides_root):
    """Generate navigation structure for all hardware guides"""
    nav_items = []
    
    # Get all category folders (shuttles, backplates, etc.)
    categories = []
    for item in os.listdir(guides_root):
        item_path = os.path.join(guides_root, item)
        if os.path.isdir(item_path) and not item.startswith('.'):
            categories.append(item)
    
    categories.sort()  # Sort alphabetically
    
    for category in categories:
        category_path = os.path.join(guides_root, category)
        
        # Format category name for display (e.g., "cable_management" -> "Cable Management")
        category_display = category.replace('_', ' ').title()
        
        # Check if category has an index.md
        category_index = os.path.join(category_path, 'index.md')
        
        # Get all guide folders in this category
        guide_folders = []
        for item in os.listdir(category_path):
            item_path = os.path.join(category_path, item)
            if os.path.isdir(item_path) and not item.startswith('.'):
                guide_folders.append(item)
        
        # Sort by index number
        guide_folders.sort(key=extract_index)
        
        # Build category nav structure
        category_nav = {category_display: []}
        
        # Add overview if it exists
        if os.path.exists(category_index):
            category_nav[category_display].append({
                f'{category_display} Overview': f'hardware/guides/{category}/index.md'
            })
        
        # Add each guide
        for guide_folder in guide_folders:
            guide_path = os.path.join(category_path, guide_folder)
            guide_index = os.path.join(guide_path, 'index.md')
            
            # Only add if index.md exists
            if os.path.exists(guide_index):
                # Get title from data.yml
                title = get_guide_title(guide_path)
                
                if title:
                    category_nav[category_display].append({
                        title: f'hardware/guides/{category}/{guide_folder}/index.md'
                    })
                else:
                    # Fallback: use folder name without index
                    display_name = re.sub(r'^\d+_', '', guide_folder)
                    display_name = display_name.replace('_', ' ').title()
                    category_nav[category_display].append({
                        display_name: f'hardware/guides/{category}/{guide_folder}/index.md'
                    })
        
        # Only add category if it has items
        if len(category_nav[category_display]) > 0:
            nav_items.append(category_nav)
    
    return nav_items


def on_config(config, **kwargs):
    """
    MkDocs hook that runs when config is loaded.
    Dynamically generates the Build Guides section of the nav.
    """
    guides_root = os.path.join(config['docs_dir'], 'hardware', 'guides')
    
    if not os.path.exists(guides_root):
        print(f"Warning: Guides folder not found at {guides_root}")
        return config
    
    # Generate the guides navigation
    guides_nav = generate_guides_nav(guides_root)
    
    # Find the Hardware section in the nav
    nav = config.get('nav', [])
    
    for i, item in enumerate(nav):
        if isinstance(item, dict) and 'Hardware' in item:
            hardware_nav = item['Hardware']
            
            # Find the Build Guides section
            for j, hw_item in enumerate(hardware_nav):
                if isinstance(hw_item, dict) and 'Build Guides' in hw_item:
                    # Replace Build Guides content with dynamically generated nav
                    hardware_nav[j] = {'Build Guides': guides_nav}
                    print(f"[nav_generator] Dynamically generated navigation for {len(guides_nav)} guide categories")
                    break
            
            break
    
    return config
