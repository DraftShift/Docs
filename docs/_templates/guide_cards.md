<div class="grid cards" style="text-align: center;" markdown>
{% for title, guide in guides.items() %}
- ## {{ title }} { .guide-toc-heading }
    [![{{ title }}]({{ guide.folder|urlencode }}/image.png){ .guide-card-image }]({{ guide.folder|urlencode }}/index.md)

    ---

    [**{{ title }}**]({{ guide.folder|urlencode }}/index.md){ .guide-card-title }  
    [*{{ guide.author }}*]({{ guide.folder|urlencode }}/index.md){ .guide-card-author }
{% endfor %}
</div>


