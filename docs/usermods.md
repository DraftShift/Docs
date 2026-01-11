---
search:
  boost: 1
---

<!-- The usermod will not be displayed if it has one of these keyword in the title. -->
{% set excludes = ['superseded', 'superseeded', 'deprecated'] %}

<!-- Set up popularity weights -->
{% set first_view_weight = 1.0 %}
{% set first_download_weight = 3.0 %}
{% set repeat_view_weight = 0.1 %}
{% set repeat_download_weight = 0.2 %}

<!-- Set limit for repeat views/downloads -->
{% set repeat_download_limit = 50 %}
{% set repeat_view_limit = 100 %}

<!-- Macro to calculate popularity -->
{% macro get_popularity(f_views, f_downloads, r_views, r_downloads) %}
    {% set r_views = [r_views, repeat_view_limit]|min %}
    {% set r_downloads = [r_downloads, repeat_download_limit]|min %}

    {% set popularity = (f_views * first_view_weight) + (r_views * repeat_view_weight) + (f_downloads * first_download_weight) + (r_downloads * repeat_download_weight) %}
    {{ popularity }}
{% endmacro %}

<!-- The variables that mods can be sorted by and their default orientation -->
{# set orders = [('popularity', 'descending'), ('title', 'ascending'), ('username', 'ascending'), ('created_date', 'descending')] #}
{% set orders = [('title', 'ascending'), ('username', 'ascending'), ('created_date', 'descending')] %}

<!-- GA4 data -->
{% set ga4_data = {} %}
{% if ga4_usermods and ga4_usermods.usermods %}
    {% for ga4_mod in ga4_usermods.usermods %}
        {% set key = ga4_mod.mod_repository ~ '/' ~ ga4_mod.mod_author ~ '/' ~ ga4_mod.mod_title %}
        {% set _ = ga4_data.update({key: ga4_mod}) %}
    {% endfor %}
{% endif %}

<!-- grab the mods from the dataset, update and sort them -->
{% set all_mods = [] %}
{% set all_tags = [] %}
{% set all_repos = [] %}
{% set all_usernames = [] %}

{% for repo in usermods.repositories %}
    {% set _ = all_tags.append(repo.name) %}
    {% set _ = all_repos.append(repo.name) %}

    {% for user in repo.users %}
        {% set _ = all_usernames.append(user.username) %}

        {% for mod in user.mods %}
            {% set tags = [(repo.name|replace(" ", "-")|lower, repo.name)] %}

            {% for tool in tools.toolheads %}
                {% set tl = tool|lower %}
                {% if tl in mod.readme_data|lower or tl in mod.name|lower %}
                    {% if tool not in all_tags %}
                        {% set _ = all_tags.append(tool) %}
                    {% endif %}

                    {% set _ = tags.append((tool|replace(" ", "-")|lower, tool)) %}
                {% endif %}
            {% endfor %}

            {% set ga4_key = repo.name ~ '/' ~ user.username ~ '/' ~ mod.name %}
            {% set ga4_mod = ga4_data.get(ga4_key, {}) %}
            {% set total_views = ga4_mod.get('total_views', 0) %}
            {% set total_downloads = ga4_mod.get('total_downloads', 0) %}

            {% set first_time_views = ga4_mod.get('first_time_views', 0) %}
            {% set first_time_downloads = ga4_mod.get('first_time_downloads', 0) %}
            {% set repeat_views = ga4_mod.get('repeat_views', 0) %}
            {% set repeat_downloads = ga4_mod.get('repeat_downloads', 0) %}

            {% set popularity = get_popularity(first_time_views, first_time_downloads, repeat_views, repeat_downloads)|float %}

            {% set _ = mod.update({'username': user.username}) %}
            {% set _ = mod.update({'repository': repo.name}) %}
            {% set _ = mod.update({'views': first_time_views|default(0)}) %}
            {% set _ = mod.update({'downloads': first_time_downloads|default(0)}) %}
            {% set _ = mod.update({'popularity': popularity}) %}
            {% set _ = mod.update({'tags': tags}) %}

            {% set ns = namespace(skip=false) %}
            {% for ex in excludes %}
                {% if ex in mod.name|lower or ex in mod.title|lower %}
                    {% set ns.skip = true %}
                {% endif %}
            {% endfor %}
            {% if not ns.skip %}
                {% set _ = all_mods.append(mod) %}
            {% endif %}
        {% endfor %}
    {% endfor %}
{% endfor %}

{# set all_mods = all_mods|sort(attribute='popularity')|reverse|list #}
{% set all_mods = all_mods|sort(attribute='username')|reverse|list %}
{% set all_tags = all_tags|sort %}
{% set all_usernames = all_usernames|unique|sort|list %}

<!-- Setup the sort and filters -->
{% set tag_options = [] %}
{% for tag in all_tags %}
{% set _ = tag_options.append('<option value="' ~ tag|replace(" ", "-")|lower ~ '">' ~ tag ~ '</option>') %}
{% endfor %}

{% set order_options = [] %}
{% for order in orders %}
{% set _ = order_options.append('<option value="' ~ order[0] ~ '" data-sort="' ~ order[1] ~'">' ~ order[0]|replace("_", " ")|title ~ '</option>') %}
{% endfor %}

{% set username_options = [] %}
{% for username in all_usernames %}
{% set _ = username_options.append('<option value="' ~ username ~ '">' ~ username ~ '</option>') %}
{% endfor %}

<!-- Make the mods accessable via javascript -->
<script>
var usermods = {{ all_mods|tojson }};
var per_page = 20;
var defaultSort = '{{ orders[1][0] }}';
var defaultSortOrder = '{{ orders[1][1] }}';
</script>

<!-- Template for the modal -->
<div id="usermod-modal" class="usermod-modal">
    <div class="usermod-modal-backdrop"></div>
    <div class="usermod-modal-content">
        <button class="usermod-modal-close" aria-label="Close">&times;</button>
        <div class="usermod-modal-body">
            <!-- These values get updated when the modal is opened -->
            <div class="usermod-modal-header" id="usermod-modal-header">
                <span id="usermod-modal-title" class="usermod-modal-title"></span>
                <span id="usermod-modal-author" class="usermod-modal-author"></span>
                <div class="usermod-modal-meta-row">
                    <!-- Views -->
                    <span class="twemoji" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"></path></svg>
                    </span>
                    <span id="usermod-modal-views" style="display: none;"></span>
                    <!-- Downloads -->
                    <span class="twemoji" style="display: none;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7z"></path></svg></span>
                    <span id="usermod-modal-downloads" style="display: none;"></span>
                    <!-- Created Date -->
                    <span class="twemoji"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 19H5V8h14m-3-7v2H8V1H6v2H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V1m-1 11h-5v5h5z"></path></svg></span>
                    <span id="usermod-modal-created"></span>
                </div>
            </div>
            <div id="usermod-modal-body">
                <!-- Image Carousel (inside body, scrolls with content) -->
                <div id="usermod-modal-carousel" class="usermod-carousel" style="display: none;">
                    <div class="usermod-carousel-main">
                        <button class="usermod-carousel-btn usermod-carousel-prev" aria-label="Previous image">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                        </button>
                        <div class="usermod-carousel-images"></div>
                        <button class="usermod-carousel-btn usermod-carousel-next" aria-label="Next image">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
                        </button>
                    </div>
                    <div class="usermod-carousel-thumbs"></div>
                </div>
                <!-- Readme content inserted here by JS -->
                <div id="usermod-modal-readme"></div>
            </div>
            <div id="usermod-modal-files">
                <div class="usermod-modal-buttons">
                    <a id="usermod-modal-github" class="usermod-github-btn" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                        View on GitHub
                    </a>
                    <a id="usermod-modal-download" class="usermod-download-btn" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7z"/></svg>
                        Download
                    </a>
                </div>
                <div id="usermod-modal-cads" class="usermod-files-section" style="display: none;">
                    <h4 class="usermod-files-heading">CAD Files</h4>
                    <ul class="usermod-files-list"></ul>
                </div>
                <div id="usermod-modal-stls" class="usermod-files-section" style="display: none;">
                    <h4 class="usermod-files-heading">STL Files</h4>
                    <ul class="usermod-files-list"></ul>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Image Lightbox -->
<div id="usermod-lightbox" class="usermod-lightbox">
    <div class="usermod-lightbox-backdrop"></div>
    <button class="usermod-lightbox-close" aria-label="Close">&times;</button>
    <button class="usermod-lightbox-prev" aria-label="Previous image">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
    </button>
    <img class="usermod-lightbox-img" src="" alt="Expanded image">
    <button class="usermod-lightbox-next" aria-label="Next image">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
    </button>
</div>

Many talented members of the StealthChanger community have generously contributed their time and work to the project. The collection of modifications below has been curated from the [DraftShift GitHub](https://github.com/DraftShift){target="_blank"} repositories to showcase their efforts and highlight the valuable additions they have created.

If you would like your mods featured here, please consider [Submitting a Usermod](contributing.md#submitting-usermods).

<!-- Filters -->
<div class="usermod-filters">
    <select name="tag-filter" title="Filter mods by criteria">
        <option value="all">All Mods</option>
        {{ tag_options|join('\n') }}
    </select>
    <div class="usermod-order-group">
        <span id="usermod-sort" class="usermod-order-icon" title="Toggle sort order">
            <span id="usermods-ascending" class="twemoji" style="display:none;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 17h3l-4 4-4-4h3V3h2M2 17h10v2H2M6 5v2H2V5m0 6h7v2H2z"></path></svg>
            </span>
            <span id="usermods-descending" class="twemoji">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 7h3l-4-4-4 4h3v14h2M2 17h10v2H2M6 5v2H2V5m0 6h7v2H2z"></path></svg>
            </span>
        </span>
        <select name="usermod-order" title="Sort mods by criteria">
            {{ order_options|join('\n') }}
        </select>
    </div>
    <select name="username-filter" title="Filter by username" style="display: none;">
        <option value="all">All Users</option>
        {{ username_options|join('\n') }}
    </select>
    <span id="usermod-results-count" class="usermod-results-count"></span>
</div>

<!-- Cards -->
<div class="grid cards" style="text-align: center;" markdown>
{% for mod in all_mods %}

- ### {{ mod.title }} { .hidden-toc-heading data-repo="{{ mod.repository }}" data-index="{{ loop.index0 }}" {% for tag in mod.tags %}data-tag-{{ tag[0] }}="{{ tag[1] }}" {% endfor %} {% for var in orders %}data-{{ var[0] }}="{{ mod[var[0]] }}" {% endfor %}data-username="{{ mod.username }}" }

    ![{{ mod.title }}]({{ mod.thumbnail if mod.thumbnail else "assets/DSD_image_missing.png" }}){ .custom-card-image }

    ---

    **{{ mod.title }}**{ .custom-card-title }
    *{{ mod.username }}*{ .custom-card-author }

    <span class="usermod-card-stats" style="display: none;">:material-eye: {{ mod.views }} :material-download: {{ mod.downloads }}</span>
    <span class="usermod-card-date">:material-calendar: {{ mod.created_date.split('T')[0] }}</span>

    <ul class="usermod-tags">
    {% for tag in mod.tags %}
        {%- if tag[1] in all_repos -%}
            <li class="usermod-tag md-tag tag-repo" data-md-color-primary="deep-purple">{{ tag[1] }}</li>
        {%- elif tag[1] in tools.toolheads -%}
            <li class="usermod-tag md-tag tag-tool" data-md-color-primary="orange">{{ tag[1] }}</li>
        {%- else -%}
            <li class="usermod-tag md-tag" data-md-color-primary="lime">{{ tag[1] }}</li>
        {%- endif %}
    {% endfor %}
    </ul>

{% endfor %}
</div>
<div id="usermod-pagination" class="usermod-pagination" aria-label="Usermods pagination"></div>
