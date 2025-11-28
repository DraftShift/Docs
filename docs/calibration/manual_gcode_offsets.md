{% macro code_block(lines="8 9 10") %}
``` cfg hl_lines="{{ lines }}"
  [tool T1]
  tool_number: 1 # change to the index of the tool. 0, 1, 2, etc.
  extruder: extruder1 # change to match the extruder you are configuring: extruder, extruder1, etc.
  fan: T1_part_fan
  params_park_x: 0 # The absolute X-position of the tool in its dock.
  params_park_y: 0 # The absolute Y-position of the tool in its dock.
  params_park_z: 0 # The absolute Z-position where the tool and shuttle mate in the dock, determined when the TAP (or Z-probe) triggers.
  gcode_x_offset: 0 # The X-Axis offset of the nozzle's orifice in relation to tool 0
  gcode_y_offset: 0 # The Y-Axis offset of the nozzle's orifice in relation to tool 0
  gcode_z_offset: 0 # The Z-Axis offset of the nozzle's orifice in relation to tool 0
```
{% endmacro %}

Manual calibration uses a paper test to measure Z-offsets between tools.

!!! note "Critical"
    - Only home or probe with T0 during this calibration

### G-code Z Offset

{{ code_block(lines="10") }}

1. Ensure **T0 is on the shuttle**
2. Run: `INITIALIZE_TOOLCHANGER`
3. Home the printer: `G28`.
4. Level the gantry: `QUAD_GANTRY_LEVEL`.
5. Home Z again: `G28 Z`.
6. Raise the nozzle 10mm: `G1 Z10 F600`.

7. Manually remove the current tool and place the next tool on the shuttle
8. Perform a [manual paper test](#manual-paper-test) and adjust Z until you feel slight resistance
9. Once satisfied, run `M114` and copy the Z value from the console.
10. Update the `gcode_z_offset` value in `[tool Tn]` section of the tool's config file
11. Repeat from **step 6** for all remaining tools
12. Run: `FIRMWARE_RESTART`

### Manual Paper Test

The “paper test” involves placing a standard sheet of paper between the build plate and the nozzle, then carefully jogging the nozzle downward until you feel slight resistance as the paper is moved back and forth.

!!! tip "Key Points"
    - Use regular copy paper (approximately 100 microns / 0.1mm thick)
    - Always perform the test at **room temperature** (both nozzle and bed cold)
    - Ensure the nozzle and bed are clean and free of debris
    - Use the same surface/tape that you normally print on

1. Cut a small piece of paper (approximately 5x3 cm).
2. Place it between the nozzle and bed.
3. Using manual movements (Mainsail/Fluidd/KlipperScreen), jog the nozzle down in small increments.
4. Push the paper back and forth to feel for resistance.
5. Continue until you feel slight friction (paper can slide but with resistance)

### G-code XY Offsets

{{ code_block(lines="8 9") }}

Calibrating XY offsets manually, involves doing test prints, visually examining the alignment and adjusting between tests. This procedure gets repeated until you are happy with the alignment.

- For manual XY calibration we recommend first using the [IDEX calibration tool](https://www.printables.com/model/201707-x-y-and-z-calibration-tool-for-idex-dual-extruder){target="_blank"} to get each tool's nozzle aligned to T0. 
- Follow that up with the [StealthChanger Logo Test Chip](https://www.printables.com/model/1092898-stealthchanger-logo-test-chip){target="_blank"} to ensure all offsets are working harmoniously.

<iframe src="https://www.printables.com/embed/201707" width="300" height="340" scrolling="no" frameborder="0"></iframe>
<iframe src="https://www.printables.com/embed/1092898" width="300" height="340" scrolling="no" frameborder="0"></iframe>