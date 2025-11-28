Automatic calibration uses specialized tools to measure X/Y/Z offsets more precisely and efficiently. Refer to each tool's documentation for specific calibration procedures.

## Available Methods

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
    
