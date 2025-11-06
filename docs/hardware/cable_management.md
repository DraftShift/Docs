---
search:
  boost: 2 
---

{% set board_data = {} %}

## Umbilical Cables
An umbilical cable is required for each toolhead. They typically route from a [distribution board](#distribution-boards) to a [toolhead board](#toolhead-boards). On a StealthChanger, keeping the tool's umbilical in a controlled state is extremely important. If a tool's umbilical were to obstruct any of the other tools, it could result in a crash and cause a print failure. 

To help the umbilical move in a controlled fashion, we employ the use of a flat spring steel or piano wire. This addition gives the umbilical a controlled arc and helps it return to its resting position safely.

!!! tip "Spring Steel?"
    Flat spring steel (3x0.3mm) is the preferred aid for the tool's umbilical. It provides better lateral control and is what comes supplied as part of the LDO Toolhead and Dock Kit.

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

## Fanny Pack
Originally by [mancheetah](#){:target="_blank"}, the Fanny Pack has been adopted by DraftShift Design as the de facto method of housing a [distribution board](#distribution-boards) on the rear of the printer. Compared to the original, our updated version brings compatibility with a number of [distribution boards](#distribution-boards) and buck converter options.

!!! danger "TODO"
    Add images

## Wire Duct
The Wire Duct serves as a conduit between the [Fanny Pack](#fanny-pack) and your printers underside. Under its cover is an EMS compatible panel for you to mount any extra pieces you might need. 

!!! danger "TODO"
    Add images
