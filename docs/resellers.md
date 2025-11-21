
{% for region in resellers.regions %}

## {{ region|upper }}

<div class="grid cards" style="text-align: center;" markdown>
{% for reseller, res_data in resellers.regions[region].items() %}
{% if res_data.is_sponsor and res_data.is_sponsor != false %}
-    ### <span style="padding-left: 30px;"><i title="{{ res_data.is_sponsor }}" style="float: right; cursor: help;">:star:{ .lg style="pointer-events: none;" }</i>
            {{- reseller -}}
        </span> 
{% else %}
-    ### {{ reseller }}
{% endif %}
    [![{{ reseller }}]({{ res_data.logo_url }}){: style="height: 128px; display: block; margin: 0 auto; padding-bottom:16px;"}]({{ res_data.url }}){target="_blank"}
{% if res_data.configurator_url %}
    [:fontawesome-solid-wrench: Configurator]({{ res_data.configurator_url }}){:target="_blank" .md-button}
{% endif -%}
{% if res_data.product_url %}
    [:material-cart: Shop]({{ res_data.product_url }}){:target="_blank" .md-button} 
{% endif %}
{% endfor %}
</div>

---

{% endfor %}

