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

# G-code Offset Calibration
{{ code_block() }}

## Important Notes 
=== "TAP"
    - **Only home/QGL/bedmesh with tool 0.** — Homing with other tools should only be done in order to switch to tool 0 which then can be used to home (again)/QGL/bedmesh.
    - **The `gcode_z_offset`, `gcode_x_offset` and `gcode_y_offset` variables for tool 0 must always be zero.** — The offset values are relative to tool 0.

    !!! warning "Before You Start"
        - Because all G-code calibrations are relative to tool 0, it is essential that the printer has perfect first layer bed adhesion with tool 0 first.
        - It is recommended that you run a test print with tool 0 before calibrating any G-code offsets.

=== "Eddy Current"
    - **Home/QGL/bedmesh is possible with any tool** — Requires the scanner to be mounted on the shuttle.
    - **`gcode_z_offset` variable must be set for every tool** — Homing with the scanner on the shuttle requires each nozzle to have a z offset relative to the scanner.
    - **`gcode_x_offset` and `gcode_y_offset` variables for tool 0 must always be zero.** — The offset values are relative to tool 0.

    !!! warning "Before You Start"
        - It is essential that the printer has perfect first layer bed adhesion with tool 0 first.
        - It is recommended that you run a test print with tool 0 before calibrating any G-code offsets.

## Manual G-code Offset Calibration

Manual calibration uses a paper test to measure Z-offsets between tools.

!!! note "Prerequisites"
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

## Automated G-code Offset Calibration
Automatic calibration uses specialized tools to measure X/Y/Z offsets more precisely and efficiently. Refer to each tool's documentation for specific calibration procedures.
### Available Methods

{% for method, data in cal_methods.items() %}
{% if method != "Manual" %}
- **[{{ method }}]({{ data.url }}){:target="_blank"}** – {{ data.description }}
{% endif %}
{% endfor %}

## Calibration With SexBall Probe

### Define Switch Location
With the SexBall Probe mounted to the printer's bed extrusion, the absolute position of the ball needs to be added to the [[gcode_macro _CALIBRATION_SWITCH]](#) variables.

``` cfg hl_lines="2 3 4"
  [gcode_macro _CALIBRATION_SWITCH]
  variable_x: 227.471875
  variable_y: 353.703125
  variable_z: 5.00
  gcode:
```

1. Home the printer with `G28`.
2. Run `QUAD_GANTRY_LEVEL` to level the gantry.
3. Home z again with `G28 Z`.
4. Manually move the gantry so that the tool is ~1mm over the ball.
5. Run `M114` to output the current position to console.
6. Enter the positions in to the [[gcode_macro _CALIBRATION_SWITCH]](#) variables.

### Enable Multi Axis Probing
- Enable the multi-axis probe by defining the [[tools_calibrate]](#) section in [toolchanger-config.cfg](#).
- Set the `pin` variable to the pin that your calibration probe is connected to.
- Calibrate `trigger_to_bottom_z`

``` cfg
  [tools_calibrate]
  pin:   #pin that your calibration probe is connected to.
  travel_speed: 20  # mms to travel sideways for XY probing
  spread: 7  # mms to travel down from top for XY probing
  lower_z: 1.0  # The speed (in mm/sec) to move tools down onto the probe
  speed: 2  # The speed (in mm/sec) to retract between probes
  lift_speed: 4  # Z Lift after probing done, should be greater than any Z variance between tools
  final_lift_z: 6 
  sample_retract_dist:2
  samples_tolerance:0.05
  samples:5
  samples_result: median # median, average
  probe: probe # name of the nozzle probe to use
  trigger_to_bottom_z: 0.25 # Offset from probe trigger to vertical motion bottoms out. 
```

!!! tip "trigger_to_bottom_z"
    `trigger_to_bottom_z` is the travel distance from the point where the nozzle touches the top of the ball to the point where the switch not only triggers, but bottoms out.

    1. Move the gantry so that the nozzle touches the top of the ball.
    2. Using small increments, lower the gantry until you hear the switch trigger.
    3. Run `M114` to log the gantry's current position to the console.
    4. Keep an eye on the tool in the shuttle and continue to lower the gantry. The point where the tool starts to lift in the shuttle is the point where the switch has bottomed out.
    5. Run `M114` again and the difference between the 2 logged values is your `trigger_to_bottom_z` value.

### SexBall Nozzle Calibration

1. Clean all the nozzles of your tools. Any debris on the tool will effect the accuracy of the results.
2. With tool 0 on the shuttle, home the printer with `G28`.
3. Run `QUAD_GANTRY_LEVEL` to level the gantry.
4. Home z again with `G28 Z`.
5. With your hand over the emergency stop, run `CALIBRATE_ALL_OFFSETS`.

!!! info "CALIBRATE_ALL_OFFSETS"
    `CALIBRATE_ALL_OFFSETS` will move the tool over the probe and heat it to 150c before locating the probe. For the first run keep an eye on the printer and make sure the values entered in the config are correct and there isn't a crash.

    After tool 0 has located the probe, it will turn off tool 0's heater and repeat the process for each subsequent tool. Tool 0 will be picked up again once the process has completed.

    The values logged to the console are the offsets to be used in the `[tool Tn]`'s `gcode_x_offset`, `gcode_y_offset` and `gcode_z_offset` variables.

### SexBall Probe Z Offset Calibration


1. Clean the tools nozzle. Any debris on the tool will effect the accuracy of the results.
2. With tool 0 on the shuttle, home the printer with `G28`.
3. Run `QUAD_GANTRY_LEVEL` to level the gantry.
4. Home z again with `G28 Z`.
5. Run `CALIBRATE_NOZZLE_PROBE_OFFSET`.

!!! info "CALIBRATE_NOZZLE_PROBE_OFFSET"
    `CALIBRATE_ALL_OFFSETS` will move the tool over the probe and heat it to 150c before locating the probe. It will then bottom out the probe and use the tool's OptoTap sensor to determine the `[tool_probe Tn]`'s `z_offset`.

    The value logged to the console is the value to be used for the `[tool_probe Tn]`'s `z_offset`.

!!! tip "Don't Trust the Robots"
    The `[tool_probe Tn]` `z_offset` should be verified using a small test print. Because this procedure depends on the accuracy of the `trigger_to_bottom_z` value, it is advisable to confirm the offset by performing a short test print and noting any adjustments required to achieve proper first-layer adhesion.

    - If you need to raise the nozzle during the test print, the `z_offset` must be adjusted closer to zero by the same amount.
    - If you need to lower the nozzle during the test print, the `z_offset` must be adjusted farther from zero by the same amount.
    
