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
                                # Debug: print what's being loaded
                                print(f"Loading guide: {folder} -> {data.get('title', 'NO TITLE')}")
                                
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
    
    @env.macro
    def github_contributors(repo="DraftShift/StealthChanger"):
        """Fetch and display GitHub contributors for a repository (cached during build)"""
        import urllib.request
        import json
        import os
        import time
        
        # Create cache directory
        cache_dir = os.path.join(os.path.dirname(__file__), '.cache')
        os.makedirs(cache_dir, exist_ok=True)
        cache_file = os.path.join(cache_dir, f'contributors_{repo.replace("/", "_")}.json')
        
        # Check if cache exists and is less than 24 hours old
        if os.path.exists(cache_file):
            cache_age = time.time() - os.path.getmtime(cache_file)
            if cache_age < 86400:  # 24 hours
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                        return cache_data.get('html', '')
                except:
                    pass
        
        try:
            # Fetch contributors from GitHub API
            url = f"https://api.github.com/repos/{repo}/contributors"
            req = urllib.request.Request(url)
            req.add_header('Accept', 'application/vnd.github.v3+json')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                contributors = json.loads(response.read().decode())
            
            # Generate HTML for contributors
            output = ['<div class="contributors-grid">']
            
            for contributor in contributors:
                login = contributor.get('login', '')
                avatar_url = contributor.get('avatar_url', '')
                profile_url = contributor.get('html_url', '')
                contributions = contributor.get('contributions', 0)
                
                output.append(f'''
                <a href="{profile_url}" class="contributor-card" target="_blank" rel="noopener">
                    <img src="{avatar_url}" alt="{login}" class="contributor-avatar">
                    <div class="contributor-info">
                        <div class="contributor-name">{login}</div>
                        <div class="contributor-contributions">{contributions} contributions</div>
                    </div>
                </a>
                ''')
            
            output.append('</div>')
            result = '\n'.join(output)
            
            # Save to cache as JSON
            try:
                cache_data = {
                    'html': result,
                    'timestamp': time.time(),
                    'contributors': contributors
                }
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(cache_data, f, indent=2)
            except:
                pass
            
            return result
            
        except Exception as e:
            # If we have an old cache, use it even if expired
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                        return cache_data.get('html', '')
                except:
                    pass
            return f'<p>Unable to load contributors: {str(e)}</p>'
