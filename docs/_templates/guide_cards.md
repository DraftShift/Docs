<div class="md-typeset">
    <div class="grid cards guide-cards-container">
    {% for title, guide in guides.items() %}
        <a href="{{ guide.folder|urlencode }}/" class="guide-card-link">
            <div class="card guide-card">
                <img src="{{ guide.folder|urlencode }}/image.png" alt="{{ title }}" class="guide-card-image">
                <div class="guide-card-content">
                    <hr class="guide-card-divider">
                    <h3 class="guide-card-title">{{ title }}</h3>
                    <p class="guide-card-author">{{ guide.author }}</p>
                </div>
            </div>
        </a>
    {% endfor %}
    </div>
</div>