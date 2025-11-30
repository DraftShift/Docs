{%- macro set_io_display(io) -%}
{%- if io is mapping -%}
{% for key, value in io.items() %}
    **{{ key }}:** {{ value }}
{% endfor %}
{%- endif -%}
{%- endmacro -%}

Distribution boards expand the number of connections available for attaching toolheads. They can either extend your CAN network or function as a USB hub. Some distribution boards also include an additional MCU, providing access to extra inputs and outputs such as filament runout switches, thermistors, RGB lighting, and other peripherals.

??? tip "CAN Bus"
    For CAN bus communication, it is highly recommended to follow [Esoterical's CAN Bus Guide](https://canbus.esoterical.online/){target="_blank"}, which provides clear, step-by-step instructions for flashing and configuring the host computer, MCU and toolhead boards.

??? tip "USB"
    For USB communication it is recommended to use the manufacturer's documentation to guide you through flashing and configuring the distribution board.

<div class="grid cards" style="text-align: center;" markdown>
{% for manufacturer, boards in distribution_boards.manufacturers.items() %}
    {% for board, data in boards.items() %}
    {% if data.features is defined %}
    {% set target_attr = "_blank" if data.external_link else "" %}
-    ## {{ board }}
    
    ![{{ board }}](../assets/distribution_boards/{{ data.image }}){: style="max-width: 250px; display: block; margin: 0 auto; border: 1px solid #999; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"}
    
    **Manufacturer:** {{ manufacturer }}
    
    **Protocol:** {{ data.features.protocol }}
    
    **Outputs:** {{ data.features.outputs }}
    
    {{ set_io_display(data.features.IO) }}
    
    [:octicons-info-16:More Info]({{ data.url }}){:target="_blank" .md-button .md-button--primary} [:material-cart:]({{ data.product_url }}){:target="{{ target_attr }}" .md-button}
    {% endif %}
    {% endfor %}
{% endfor %}
</div>
