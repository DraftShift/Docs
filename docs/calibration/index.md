# Calibration Overview
StealthChanger calibration consists of three primary stages: [Probe Offset](#probe-offset), [Dock Positions](#dock-positions), and [G-code Offsets](#g-code-offsets).

## Probe Offset
Probe offset refers to the `[tool_probe]` parameter `z_offset` which is applied whenever the printer homes or performs bed leveling. This value represents the vertical distance between the probe’s trigger point and the nozzle tip, allowing Klipper to accurately determine the true Z=0 position for a given tool. A `z_offset` must be calibrated for T0, and for any additional tool that will be used for homing.

!!! info "I'm building all my tools from the same hardware"
    Even when using identical hardware, each tool may require a unique `z_offset` due to:

    - Variations in hardware components.
    - Differences resulting from printing or assembly tolerances.
    - Slight deviations between the nozzle’s physical zero point and the probe’s trigger point.

Accurate `z_offset` values ensure consistent and reliable first-layer performance across all tools.

## Dock Positions
Dock Positions refers to the `[tool Tn]` parameters `params_park_x`, `params_park_y`, and `params_park_z`. These values tell the printer the precise coordinates required to pick up or return a tool to its designated dock. In essence, a dock position defines the exact X/Y/Z point where the shuttle aligns with a tool so that the mechanical coupling can occur reliably. You can think of it as the tool’s pickup location for its specific dock.

Each tool requires its own dock position because the docks are mounted at different locations along the front of the printer. Even small variations in mounting or alignment can cause the shuttle to miss the tool or collide with the dock.

When dock positions are accurately calibrated, tool changes are consistent, repeatable, and free from collisions.

!!! tip "Calibrate you printer first"
    Before setting dock positions, it is strongly recommended to calibrate your printer’s zero point.

    Dock positions are defined relative to absolute zero—if the printer’s zero point changes, the dock positions will shift accordingly.

## G-code Offsets

G-code offsets refers to the `[tool Tn]` parameters `gcode_z_offset`, `gcode_x_offset` and `gcode_y_offset`. These values determine the difference in the nozzle's position for each tool when it is on the shuttle, relative to T0. 

!!! info "Why G-code offsets matter"
    When the slicer generates `G1 X100 Y100`, every tool should deposit filament at exactly the same physical location on the bed. G-code offsets make this possible by telling Klipper "this tool is 0.2mm left and 0.1mm forward off the reference tool, so adjust accordingly."

### G-code Offset Calibration Methods
There are multiple methods of calibrating the G-code offsets, 

{% for method, data in cal_methods.items() %}
- **[{{ method }}]({{ data.url }}){:target="_blank"}** – {{ data.description }}
{% endfor %}
