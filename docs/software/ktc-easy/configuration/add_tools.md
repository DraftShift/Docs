
# Adding Subsequent Tools

Adding additional tool configurations works much like setting up T0. Simply create a new [tool configuration](../configuration/tool.md) file and populate it with the necessary values. If your tools share similar hardware, you can save time by copying an existing [tool configuration](../configuration/tool.md)
 and renaming it to Tn.cfg.

## Numbering
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} requires the tools to be numbered sequentially. If you only have `T0.cfg` you next [tool config](../configuration/tool.md) must be `T1.cfg`.

The following items need to be incremented:

* `[mcu]` section name. All references to the MCU name's pins will need to be changed as well. 
* `[extruder]` section name.
* `[tmc2209]` section name.
* `[heater_fan]` section name and its `heater` variable.
* `[generic_fan]` section name.
* `[tool]` section name and its `tool_number`, `extruder` and `fan` variables.
* `[tool_probe]` name and its `tool` and `activate_gcode` variables.
* `[gcode_macro Tn]` and its `gcode` variable.

If you have any extra sections such as RGB, ADXL345, etc. They will also need to be incremented.

## Calibrated Values
If you copied a previous tool's config, all calibrated values are for the previous tool. They will need to be recelebrated for the new tool.

These include:

* PID calibration in the `[extruder]` section.
* `gcode_x_offset` in the `[tool]` section.
* `gcode_y_offset` in the `[tool]` section.
* `gcode_z_offset` in the `[tool]` section.
* `params_park_x` in the `[tool]` section.
* `params_park_y` in the `[tool]` section.
* `params_park_z` in the `[tool]` section.
* `z_offset` in the `[tool_probe]` section.


## Simpler Than It Looks
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} makes adding more tools and getting them to work with klipper is a rather simple process. At this point the tools should show up in the UI and you should be able to control the heaters, fans and so on. However, there are more steps required to get the printer to change tools.

Go through the [Pre Launch](../configuration/validation.md#pre-launch) steps again for each additional tool, optionally excluding the [Probe offset](../configuration/validation.md#probe-offset) calibration and [First Print](../configuration/validation.md#first-print) test.

!!! tip "Probe Offsets for Subsequent Tools"
    All tool offsets are calibrated relative to T0. Setting probe offsets for tools other than T0 is generally only useful if you need to home using that specific tool. However, even if another tool is used for homing, it is required to home using T0 again before starting a print to ensure consistent alignment and accuracy.

With the tools broken in and functioning corrently, we can move on to [Calibration](../../../calibration/index.md).