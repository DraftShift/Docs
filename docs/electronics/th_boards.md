
Each toolhead in a multi-tool setup requires its own dedicated toolhead board. Without these boards, the wiring for heaters, sensors, fans, and motors would quickly become unmanageable as the number of tools increases. Toolhead boards consolidate all of a tool’s connections into a single, organized interface, preventing the wiring complexity from becoming overwhelming and greatly simplifying installation, maintenance, and troubleshooting.

??? tip "CANBUS"
    For canbus communication, it is highly recommended to follow [Esoterical's CANBUS Guide](https://canbus.esoterical.online/){target="_blank"}, which provides clear, step-by-step instructions for flashing and configuring the host computer, MCU and toolhead boards.

??? tip "USB"
    For USB communication it is recommended to use the manufacturer's documentation to guide you through flashing and configuring the toolhead boards.

<div class="grid cards" style="text-align: center;" markdown>
{% for manufacturer, boards in tool_boards.manufacturers.items() %}
    {% for board, data in boards.items() %}
    {% if data.features is defined %}
    {% set target_attr = "" if data.external_link else "_blank" %}
-    ## {{ board }}
    
    ![{{ board }}](../assets/tool_boards/{{ data.image }}){: style="max-width: 250px; display: block; margin: 0 auto; border: 1px solid #999; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"}
    
    **Manufacturer:** {{ manufacturer }}

    **Protocol:** {{ data.features.protocol }}
    
    **Fan Outputs:** {{ data.features.fans|string }}
    
    **Fan Voltage:** {{ data.features.fan_voltage|string }}
    
    **Thermistor:** {{ data.features.thermistor|string }}
    
    **RGB:** {{ data.features.rgb|string }}
    
    **Probe:** {{ data.features.probe|string }}
    
    **Filament Sensor:** {{ data.features.filament_sensor|string }}
    
    [:fontawesome-solid-info-circle: More Info]({{ data.url }}){:target="_blank" .md-button .md-button--primary} [:material-cart:]({{ data.product_url }}){:target="{{ target_attr }}" .md-button}
    {% endif %}
    {% endfor %}
{% endfor %}
</div>
