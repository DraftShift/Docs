<div class="grid cards" style="text-align: center;" markdown>
{% for title, guide in guides.items() %}
- ## {{ title }} { .hidden-toc-heading }
    [![{{ title }}]({{ guide.folder|urlencode }}/image.png){ .custom-card-image }]({{ guide.folder|urlencode }}/index.md)

    ---

    [**{{ title }}**]({{ guide.folder|urlencode }}/index.md){ .custom-card-title }  
    [*{{ guide.author }}*]({{ guide.folder|urlencode }}/index.md){ .custom-card-author }
{% endfor %}
</div>


