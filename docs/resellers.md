# title overwrite


{% for region in resellers.regions %}

##{{ region|upper }}
<div class="md-typeset">
    <div class="grid cards guide-cards-container">
        <ul style="list-style-type: none;">
                {% for reseller, res_data in resellers.regions[region].items() %}
                    <li>
                        <a href="{{ res_data.url }}/" class="guide-card-link">
                            <div class="grid cards" style="text-align: center;">
                                <div class="card">
                                    <div class="card-content">
                                        <h2 class="card-title">{{ res_data.name }}</h2>
                                        <div class="card-text">
                                            <img src="{{ res_data.logo_url }}" alt="{{ res_data.name }}" style="max-width: 100%; max-height: 100px;">
                                            <p>{{ res_data.description }}</p>
                                            <a href="{{ res_data.product_url }}" class="md-button">
                                                <i class="fas fa-shopping-cart"></i> Kits
                                            </a>
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
