

For the purposes of StealthChanger the toolhead selection is rather important. It is often the deciding factor in how the rest of the build is configured. It determines which docks you can use, the maximum number of tools you can use, and can also have a large impact on power requirements.


???+ info "Printing"
    Officially supported toolheads require no modifications to operate with StealthChanger beyond the installation of the StealthChanger backplate and, where applicable, a spacer. Each toolhead can be sourced from their respective repositories. 
    
    Toolheads that require modification to work with StealthChanger are not officially supported and should be submitted as a usermod.

??? info "Extruders"
    * You can use any extruder you want as long as it is supported by the toolhead of your choice.
    * It's important to note that the width of the extruder may impact the maximum tool count as it may require a wider dock, limiting the total number of tools that can be accommodated.
    * :warning: Pay attention to the tensioning screw on the extruder, it may collide with the tool beside it if it extends outside the tool's width and there is not enough room between them.

??? info "Hotends"
    * Choose whichever hotend you like, as long as the toolhead supports it, you can use it.
    * :warning: Some high-flow hotends may require significant tuning to prevent oozing while moving to and from the dock.

??? tip "Community Recommendation"
    [Anthead](#anthead) is the recommended toolhead due to its integrated magnets in the fan ducts, which enhance stability during the docking process. Other tools can achieve similar results, but may require additional modifications.

    The LDO `Toolhead and Dock Kit` includes all necessary hardware for the [Anthead](#anthead), with the exception of the extruder and hotend components.

<div class="grid cards" style="text-align: center;" markdown>

{% for tool, tool_data in tools.toolheads.items() %}
    {% set v250 = tools.max_tools[tool_data.dock_width][250]|string if tools.max_tools[tool_data.dock_width][250] > 0  else '-' %}
    {% set v300 = tools.max_tools[tool_data.dock_width][300]|string if tools.max_tools[tool_data.dock_width][300] > 0  else '-' %}
    {% set v350 = tools.max_tools[tool_data.dock_width][350]|string if tools.max_tools[tool_data.dock_width][350] > 0  else '-' %}
    {% set m180 = tools.max_tools[tool_data.dock_width][180]|string if tools.max_tools[tool_data.dock_width][180] > 0  else '-' %}
-   <span id="{{ tool.replace(' ', '_').lower() }}"></span>

    ### {{ tool }}

    ![{{ tool }}](../assets/tools/{{ tool }}.jpg){: style="max-width: 250px; display: block; margin: 0 auto; border: 1px solid #999; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"}

    **Author:** {{ tool_data.author }}

    **Dock Width:**{ title="Standard: 60mm<br>Wide: 76mm" } {{ tool_data.dock_width.capitalize() }}

    **Short Dock:**{ title="The height of the dock (Z axis) being less than standard. For Voron printers, the shorter height is not available for larger toolheads. Compatibility with Door Buffer varies depending on toolhead configuration. For Micron printers the short variant is a requirement." } {{ ':fontawesome-solid-check:{ style="color:green;" }' if tool_data.short_dock else ':fontawesome-solid-xmark:{ style="color:red;" }' }}

    **Stubby Dock:**{ title="The depth of the dock (Y axis) being less than standard and is not compatible with Door Buffer and is only available for the smaller toolheads." } {{ ':fontawesome-solid-check:{ style="color:green;" }' if tool_data.stubby_dock else ':fontawesome-solid-xmark:{ style="color:red;" }' }}

    | Size | Max Tools |
    |--------------|------------|
    | 250mm Voron  | {{ v250 }} |
    | 300mm Voron  | {{ v300 }} |
    | 350mm Voron  | {{ v350 }} |
    | 180mm Micron | {{ m180 }} |

    [:fontawesome-brands-github: View on GitHub]({{ tool_data.url }}){:target="_blank" .md-button}

{% endfor %}

</div>
