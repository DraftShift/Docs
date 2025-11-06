def define_env(env):
    import os
    import yaml

    yaml_folder   = os.path.join(env.project_dir, 'data')
    guides_folder = os.path.join(env.project_dir, 'docs', 'hardware', 'guides')

    def open_yaml_file(filepath):
        """Helper function to open and parse a YAML file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)

        except Exception as e:
            print(f"Error loading {filepath}: \n{e}")
            return None

    # Go through the YAML files in the YAML folder and create an env variable based on the file name
    for filename in os.listdir(yaml_folder):
        if filename.endswith('.yml') or filename.endswith('.yaml'):
            yaml_path = os.path.join(yaml_folder, filename)
            yaml_name = filename.strip('.yml').strip('.yaml')

            if os.path.exists(yaml_path):
                yaml_data = open_yaml_file(yaml_path)

                if yaml_data:
                    env.variables[yaml_name] = yaml_data

    env.variables.guides = {}

    # Go through the guides folder and look for folders with YAML files and create an env variable based on the folder name
    for folder in os.listdir(guides_folder):
        guide_parent = os.path.join(guides_folder, folder)
        if os.path.isdir(guide_parent):
            for guide_folder in os.listdir(guide_parent):
                guide_path = os.path.join(guide_parent, guide_folder)

                if os.path.isdir(guide_path):
                    guide_folder = guide_folder.replace(" ", "_").lower()
                    
                    # Look for YAML files in the guide folder
                    for filename in os.listdir(guide_path):
                        if filename.endswith('.yml') or filename.endswith('.yaml'):
                            filepath = os.path.join(guide_path, filename)
                            data = open_yaml_file(filepath)

                            if data:

                                data['folder'] = guide_folder
                                try:
                                    env.variables.guides[folder][data['title']] = data

                                except KeyError:
                                    env.variables.guides[folder] = {}
                                    env.variables.guides[folder][data['title']] = data


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
