def define_env(env):
    """Load assembly YAML files and make them available as Jinja variables"""
    import os
    import yaml
    env.variables.assembly = None
    env.variables.toolheads = {}
    env.variables.max_tools = {}
    env.variables.guides = {}

    # Load tools.yml
    tools_file = os.path.join(env.project_dir, 'docs', 'hardware', 'tools', 'tools.yml')

    if os.path.exists(tools_file):
        try:
            with open(tools_file, 'r', encoding='utf-8') as f:
                tools_data = yaml.safe_load(f)
                if tools_data:
                    if 'toolheads' in tools_data:
                        env.variables.toolheads = tools_data['toolheads']
                    if 'max_tools' in tools_data:
                        env.variables.max_tools = tools_data['max_tools']
        except Exception as e:
            print(f"Error loading tools.yml: {e}")

    # Load all guides at startup
    def load_all_guides():
        """Load all hardware guides and organize them by category in nav order"""
        guides_base = os.path.join(env.project_dir, 'docs', 'hardware', 'guides')
        
        if not os.path.exists(guides_base):
            return {}
        
        # Load mkdocs.yml to get nav order for all categories
        nav_orders = {}
        mkdocs_path = os.path.join(env.project_dir, 'mkdocs.yml')
        try:
            with open(mkdocs_path, 'r', encoding='utf-8') as f:
                mkdocs_data = yaml.load(f, Loader=yaml.FullLoader)
                if mkdocs_data and 'nav' in mkdocs_data:
                    # Find the category in the nav structure
                    for item in mkdocs_data['nav']:
                        if isinstance(item, dict) and 'Hardware' in item:
                            hardware_nav = item['Hardware']
                            for hw_item in hardware_nav:
                                if isinstance(hw_item, dict) and 'Build Guides' in hw_item:
                                    build_guides = hw_item['Build Guides']
                                    for guide_item in build_guides:
                                        if isinstance(guide_item, dict):
                                            for key, value in guide_item.items():
                                                if isinstance(value, list):
                                                    # Extract folder names from paths
                                                    for sub_item in value:
                                                        if isinstance(sub_item, str):
                                                            # Extract category and folder from path
                                                            parts = sub_item.split('/')
                                                            if len(parts) >= 5 and parts[0] == 'hardware' and parts[1] == 'guides':
                                                                category = parts[2]
                                                                folder = parts[3]
                                                                if category not in nav_orders:
                                                                    nav_orders[category] = []
                                                                nav_orders[category].append(folder)
                                                        elif isinstance(sub_item, dict):
                                                            # Handle nested items like "Sexball Probe: hardware/guides/calibration_tools/sexball/index.md"
                                                            for sub_key, sub_value in sub_item.items():
                                                                if isinstance(sub_value, str):
                                                                    parts = sub_value.split('/')
                                                                    if len(parts) >= 5 and parts[0] == 'hardware' and parts[1] == 'guides':
                                                                        category = parts[2]
                                                                        folder = parts[3]
                                                                        if category not in nav_orders:
                                                                            nav_orders[category] = []
                                                                        nav_orders[category].append(folder)
        except Exception as e:
            print(f"Error loading nav order from mkdocs.yml: {e}")
        
        # Load all guides from all categories
        all_guides = {}
        for category in os.listdir(guides_base):
            category_path = os.path.join(guides_base, category)
            if not os.path.isdir(category_path):
                continue
            
            guide_data = {}
            for guide_folder in os.listdir(category_path):
                guide_path = os.path.join(category_path, guide_folder)
                
                if os.path.isdir(guide_path):
                    data_file = os.path.join(guide_path, 'data.yml')
                    
                    try:
                        with open(data_file, 'r', encoding='utf-8') as f:
                            data = yaml.safe_load(f)
                            
                            if data:
                                if 'model' in data:
                                    data["model"] = f"/hardware/guides/{category}/{guide_folder}/{data['model']}"
                                
                                # Add the folder name for URL generation
                                data["folder"] = guide_folder
                                
                                guide_data[guide_folder] = data
                    
                    except Exception as e:
                        print(f"Error loading {data_file}: {e}")
            
            # Sort guides based on nav order
            hardware = {}
            if category in nav_orders:
                for folder_name in nav_orders[category]:
                    if folder_name in guide_data:
                        data = guide_data[folder_name]
                        hardware[data["title"]] = data
                # Add any remaining guides not in nav order
                for folder_name, data in guide_data.items():
                    if data["title"] not in hardware:
                        hardware[data["title"]] = data
            else:
                # No nav order found, just add all guides
                for folder_name, data in guide_data.items():
                    hardware[data["title"]] = data
            
            all_guides[category] = hardware
        
        return all_guides
    
    # Load all guides at startup
    env.variables.guides = load_all_guides()


    @env.macro
    def get_hardware(category):
        """Get hardware guides for a specific category"""
        return env.variables.guides.get(category, {})


    @env.macro
    def usermod_author(url):
        """Extract the author name from a UserMods URL path"""
        import re
        # Match text between "UserMods/" and the next "/"
        match = re.search(r'UserMods/([^/]+)/', url)
        if match:
            return match.group(1)
        return ""
