<div class="md-typeset">
    <div class="grid cards guide-cards-container">
    {% for title, guide in guides.items() %}
        <a href="{{ guide.folder }}/" class="guide-card-link">
            <div class="card guide-card">
                {% if guide.image is defined %}
                <img src="{{ guide.image }}" alt="{{ title }}" class="guide-card-image">
                {% else %}
                <img src="/assets/DSD_Soon.svg" alt="{{ title }}" class="guide-card-image">
                {% endif %}
                <div class="guide-card-content">
                    <hr class="guide-card-divider">
                    <h3 class="guide-card-title">{{ title }}</h3>
                </div>
            </div>
        </a>
    {% endfor %}
    </div>
</div>