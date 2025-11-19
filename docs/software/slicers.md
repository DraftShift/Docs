
## Usage
Slicing for StealthChanger has some key differences compared to a standard printer. The following sections will explain some tool changing specific nuances that need to be considered.

### Tool Retraction
Adding extra retraction during tool changes is recommended and can be beneficial to help prevent oozing while docked. Typically there will be a setting in the slicer specifically for this purpose.

### Tool Temperatures
During a print, not all tools are being used at once. Turning off the heaters of unused tools can result in long wait times when switching to the next tool and keeping them at printing temperature can result in excess oozing. It is advised to have an "idle" temperature for your unused tools which is below the minimum extrusion temperature for the filament being printed. 

The "idle" temperature is usually found in the filament settings. 

!!! tip "OrcaSlicer Ooze Prevention"
    OrcaSlicer has advanced ooze prevention that will preheat the nozzle just before picking it up again. This setting can be found in the [Multimaterial section](https://github.com/SoftFever/OrcaSlicer/wiki/multimaterial_settings_ooze_prevention) of OrcaSlicer.

### Prime Tower
Using a prime tower is highly recommended with StealthChanger. Typically, slicers will place them at the rear of the print. For StealthChanger it is often best for the prime tower to be placed in front of the print so that the tool does not need to pass over the print to reach it.

!!! question "I thought tool changers had no waste?"
    It's in the name, the prime tower's purpose is to `prime` the nozzle to be ready for printing.

    It's true that you can run StealthChanger without a prime tower, however, printing without a prime tower requires extensive tuning to make sure that you are getting no ooze and the filament within the nozzle is prime condition for printing. 

    The filament within the nozzle will degrade over time, the longer its left heating in the nozzle the more fluid, and less printable it becomes. 
    
    Printing without a prime tower is often best suited for objects that use every tool on every layer because the filament within the nozzle does not have enough time to degrade between changes.

## Slicer Differences
For StealthChanger we use standard gcode to change and operate the tools. Many modern slicers have the capability to generate gcode to work with StealthChanger. See below for some key supported features by the commonly used slicers.

{% for category in slicers[slicers|first].features %}
=== "{{ category }}"
    | Feature {%- for slicer in slicers -%}| {{ slicer }} {%- endfor -%}|
    | :-: {%- for slicer in slicers -%}| :-: {%- endfor -%}|{% for feature in slicers[slicers|first].features[category] %}
    | {{ feature }} {%- for slicer, data in slicers.items() -%}| {{ ':fontawesome-solid-asterisk:{style="color:orange;"}' if data.features[category][feature] == 'kinda' else (':fontawesome-solid-check:{ style="color:green;" }' if data.features[category][feature] else ':fontawesome-solid-xmark:{ style="color:red;" }') }} {%- endfor -%}|{% endfor %}
{% endfor %}

!!! example ":fontawesome-solid-asterisk:{style="color:orange;"} Bug"
    Feature is supported but not functioning as intended.

## Slicer Gcodes
Depending on the slicer's provenance, the internal macro variables can differ. It is important to translate the internal variables in to universal variables Klipper's `PRINT_START` macro can use. 

The [example PRINT_START macro](../software/ktc-easy/examples.md#__tabbed_9_1) accepts the following parameters:

- `TOOL_TEMP` — Temperature for the initially selected tool.
- `T0_TEMP`, `T1_TEMP`, etc. — Individual temperatures for each tool (only passed if tool is used).
- `BED_TEMP` — Bed temperature for the first layer.
- `TOOL` — Initial tool number to start with.

See below for custom gcode macros that will send the correct syntax to the [example PRINT_START macro](../software/ktc-easy/examples.md#__tabbed_9_1) for each of the supported slicers.

{% for slicer, data in slicers.items() %}

### <a href="{{ data.github }}" target="_blank">![{{ slicer }}](../assets/slicers/{{ slicer }}.png){width=32}</a> {{ slicer }}

{% for gcode in data.gcodes %}
**{{ gcode }} Gcode**

``` cfg { .copy }
{{ data.gcodes[gcode] }}
```
{% endfor %}

---
{% endfor %}