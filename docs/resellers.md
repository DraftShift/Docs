

{% set annotation_counter = namespace(value=0) %}

{% for region in resellers.regions %}

## {{ region|upper }}

<div class="md-typeset">
    <div class="grid cards guide-cards-container">
        <ul style="list-style-type: none;">
                {% for reseller, res_data in resellers.regions[region].items() %}
                    <li>
                        <a href="{{ res_data.url }}/" target="_blank" class="guide-card-link">
                            <div class="grid cards" style="text-align: center;">
                                <div class="card" style="position: relative; overflow: visible;">
                                    {% if res_data.is_sponsor and res_data.is_sponsor != false %}
                                    {% set annotation_counter.value = annotation_counter.value + 1 %}
                                    <span style="position: absolute; top: 10px; right: 10px; z-index: 100; font-size: 1.2rem; background: var(--md-primary-fg-color); color: var(--md-primary-bg-color); padding: 6px 10px; border-radius: 8px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: help;" title="{{ res_data.is_sponsor }}">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 1em; height: 1em; fill: currentColor; vertical-align: middle;"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" /></svg>
                                    </span>
                                    {% endif %}
                                    <div class="card-content">
                                        <h2 class="card-title">{{ res_data.name }}</h2>
                                        <div class="card-text">
                                            <img src="{{ res_data.logo_url }}" alt="{{ res_data.name }}" style="max-width: 100%; max-height: 100px;">
                                            <p>{{ res_data.description }}</p>
                                            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                                                <a href="{{ res_data.product_url }}" target="_blank" class="md-button">
                                                    <i class="fas fa-shopping-cart"></i> Kits
                                                </a>
                                                {% if res_data.configurator_url %}
                                                <a href="{{ res_data.configurator_url }}" target="_blank" class="md-button">
                                                    <i class="fas fa-cog"></i> Configurator
                                                </a>
                                                {% endif %}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </li>
                {% endfor %}
        </ul>
    </div>
</div>
{% endfor %}
