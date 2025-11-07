---
search:
  boost: 2 
---

{% set board_data = {} %}

## Power Requirements
Adding more tools increases the power draw. The required wattage for your build will need to be calculated depending on the chosen hardware for each tool by the end user. 

!!! info "Wattage Calculation"
    See the following example of how one could calculate the wattage required for 6 tool heads.

    - Printing heater max output = `70W`
    - Printing fans - 3 total = `(0.1A * 3 fans) * 24V = 7.2W`
    - Resting heater output (30% of max for 5 tools) = `((70W / 100) * 30) * 5 tools = 105W`
    - Resting fans - 5 tools - `(0.1A * 24V) * 5 tools = 12W`
    - Extruder motors - 0.6A for 6 tools - `(0.6A * 24V) * 6 tools = 86W`

    6 tools with a 70w heater has resulted in `280W` total. This greatly exceeds the standard Voron 200W power supply without taking the rest of the system in to account and either an additional power supply is required to make up the difference or the standard power supply needs to be replaced with a larger wattage supply.

!!! danger "Unsure?"
    If you are unsure of your power requirements please reach out for help from the community via one of the social platforms. 


## Toolhead Boards
Each tool requires a toolhead board to go with it. With multiple tools, the wiring would become a nightmare to manage without them. See the below table for a list of boards and their features.

| Board | Protocol | Fan Outputs | Fan Voltage | Thermistor | Max Heater | MAX31865 | RGB | Endstops | Passthrough |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
{% for board, data in board_data.items() %}
{% set fans    = "-" if data.fans < 0 else data.fans|string %}
{% set thermistor = "-" if data.fans < 0 else data.fans|string %}
{% set rgb    = "-" if data.rgb < 0 else data.rgb|string %}
{% set probe    = "-" if data.probe < 0 else data.probe|string %}

| [{ board }]({ data.url }){: target="_blank} | { data.protocol } | { fans } | { data.fan_voltage } | { thermistor } | { data.heater_max } | { data.max31865 } | { rgb } | { probe } | { data.endstops } | { data.passthrough } | 
{% endfor %}

## Distribution Boards
Distribution boards extend the amount of connections available that can be used to attach tool heads. They will be either extend your CAN network or will behave as a USB hub. Some boards also have an additional MCU that gan give you access to additional runout switches, thermistors, RGB, etc.

See below table of known boards for their protocol and capability:
!!! danger "TODO"
    Add images

| Board | Protocol | Outputs | GPIO | Thermistor | RGB |
| :-: | :-: | :-: | :-: | :-: | :-: |
{% for board, data in board_data.items() %}
{% set outputs    = "-" if data.outputs < 0 else data.outputs|string %}
{% set gpio       = "-" if data.gpio < 0 else data.gpio|string %}
{% set thermistor = "-" if data.thermistor < 0 else data.thermistor|string %}
{% set rgb        = "-" if data.rgb < 0 else data.rgb|string %}
| [{ board }]({ data.url }){: target="_blank} | { data.protocol } | { outputs } | { gpio } | { thermistor } | { rgb } | 
{% endfor %}