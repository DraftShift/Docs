## Overview

=== "Summary"
    {% filter indent(width=4) -%}
{{ assembly.summary }}
    {%- endfilter %}

=== "Printed BOM"

{% for item, data in assembly.printed_bom.items() %}
    * {{ item }} x{{ data.qty }} {% if data.urls is defined %}{% for anchor, url in data.urls.items() %}[[{{ anchor }}]({{ url }})] {% endfor %}{% endif %}
{% endfor %}

=== "Hardware BOM"

{% for item, data in assembly.hardware_bom.items() %}
    * {{ item }} x{{ data.qty }} {% if data.urls is defined %}{% for anchor, url in data.urls.items() %}[[{{ anchor }}]({{ url }})] {% endfor %}{% endif %}
{% endfor %}