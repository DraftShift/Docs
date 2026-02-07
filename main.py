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
            yaml_name = filename[:filename.index(".")]

            if os.path.exists(yaml_path):
                yaml_data = open_yaml_file(yaml_path)

                if yaml_data:
                    print(f"Loading data: {yaml_name}")
                    env.variables[yaml_name] = yaml_data

    env.variables.guides = {}

    # Go through the guides folder and look for folders with YAML files and create an env variable based on the folder name
    for folder in os.listdir(guides_folder):
        guide_parent = os.path.join(guides_folder, folder)
        if os.path.isdir(guide_parent):
            for guide_folder in os.listdir(guide_parent):
                guide_path = os.path.join(guide_parent, guide_folder)

                if os.path.isdir(guide_path):
                    # Store the actual folder name (with spaces, original case)
                    # This is used for generating correct paths in templates
                    actual_folder_name = guide_folder
                    
                    # Look for YAML files in the guide folder
                    for filename in os.listdir(guide_path):
                        if filename.endswith('.yml') or filename.endswith('.yaml'):
                            filepath = os.path.join(guide_path, filename)
                            data = open_yaml_file(filepath)

                            if data:
                                # Debug: print what's being loaded
                                print(f"Loading guide: {folder} -> {data.get('title', 'NO TITLE')}")
                                
                                data['folder'] = actual_folder_name
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
    def format_count(count):
        """
        Format view/download counts for display.
        Numbers over 999 are converted to 'k' format with increments of 100.
        
        Examples:
            999 -> "999"
            1000 -> "1k"
            1050 -> "1k"
            1100 -> "1.1k"
            1500 -> "1.5k"
            2340 -> "2.3k"
        
        Args:
            count: Integer count to format
        
        Returns:
            Formatted string
        """
        try:
            count = int(count)
        except (ValueError, TypeError):
            return "0"
        
        if count < 1000:
            return str(count)
        
        # Convert to thousands and round to nearest 0.1
        k_value = count / 1000.0
        # Round to 1 decimal place
        k_rounded = round(k_value, 1)
        
        # Format: if it's a whole number, don't show decimal
        if k_rounded == int(k_rounded):
            return f"{int(k_rounded)}k"
        else:
            return f"{k_rounded}k"
    
    @env.macro
    def get_popularity(f_views, f_downloads, r_views, r_downloads, created_date=None):
        """
        Calculate popularity score with conversion rate and time decay.
        
        Args:
            f_views: First-time views
            f_downloads: First-time downloads
            r_views: Repeat views
            r_downloads: Repeat downloads
            created_date: ISO date string (optional, for time decay calculation)
        
        Returns:
            Float popularity score
        """
        import math
        from datetime import datetime
        
        # Weights
        FIRST_VIEW_WEIGHT = 1.0
        FIRST_DOWNLOAD_WEIGHT = 10.0
        REPEAT_VIEW_WEIGHT = 0.1
        REPEAT_DOWNLOAD_WEIGHT = 0.5
        
        # Limits
        REPEAT_VIEW_LIMIT = 100
        REPEAT_DOWNLOAD_LIMIT = 50
        
        # Apply limits to repeat metrics
        r_views = min(r_views, REPEAT_VIEW_LIMIT)
        r_downloads = min(r_downloads, REPEAT_DOWNLOAD_LIMIT)
        
        # Base popularity score
        popularity = (
            (f_views * FIRST_VIEW_WEIGHT) +
            (r_views * REPEAT_VIEW_WEIGHT) +
            (f_downloads * FIRST_DOWNLOAD_WEIGHT) +
            (r_downloads * REPEAT_DOWNLOAD_WEIGHT)
        )
        
        # Apply time decay if created_date is provided
        if created_date:
            try:
                # Parse ISO date string
                created = datetime.fromisoformat(str(created_date).split('T')[0])
                now = datetime.now()
                age_in_days = (now - created).days
                
                # Apply exponential decay (180-day half-life)
                decay_factor = math.exp(-age_in_days / 180)
                popularity = popularity * decay_factor
            except (ValueError, AttributeError):
                # If date parsing fails, skip decay
                pass
        
        return popularity
    
    @env.macro
    def github_contributors(repo="DraftShift/Docs"):
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
                # contributions = contributor.get('contributions', 0)
                
                output.append(f'''
                <a href="{profile_url}" class="contributor-card" target="_blank" rel="noopener">
                    <img src="{avatar_url}" alt="{login}" class="contributor-avatar">
                    <div class="contributor-info">
                        <div class="contributor-name">{login}</div>
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

    @env.filter
    def relative_url(path):
        """Convert an absolute docs path to a relative path from the current page.
        
        Example: From 'calibration/index.md', '/hardware/calibration_tools/#sexball-probe'
        becomes '../hardware/calibration_tools.md#sexball-probe'
        """
        import posixpath
        
        # External URLs - return as-is
        if path.startswith(('http://', 'https://')):
            return path
        
        # Not an absolute path - return as-is
        if not path.startswith('/'):
            return path
        
        # Get current page path from the environment
        try:
            current_page = env.page.file.src_path.replace('\\', '/')
        except (AttributeError, TypeError):
            # Fallback if page context not available - just strip leading slash and fix anchor
            if '#' in path:
                path_part, anchor = path.split('#', 1)
                return path_part.lstrip('/') + '.md#' + anchor
            return path.lstrip('/')
        
        # Split anchor/fragment from path
        if '#' in path:
            path_part, anchor = path.split('#', 1)
            anchor = '.md#' + anchor
        else:
            path_part = path
            anchor = ''
        
        # Remove leading/trailing slashes and normalize
        target_path = path_part.strip('/')
        
        # Get directory of current page
        current_dir = posixpath.dirname(current_page)
        
        # Calculate relative path
        relative = posixpath.relpath(target_path, current_dir)
        
        return relative + anchor
