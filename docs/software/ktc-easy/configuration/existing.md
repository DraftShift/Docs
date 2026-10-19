
In order for [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} to operate, some of your existing config will either be made redundant or need to be transferred in to a tool config file.

## Toolhead Sections
Everything related to the toolhead will be moved in to a [tool config](../configuration/tool.md) file or made redundant. 

For now, it's best to comment out these items so they can be easily referenced later if needed.

* [mcu mcu_name]
* [extruder]
* [tmc2209 extruder]
* [adxl345]
* [fan]
* [heater_fan]

There may be more sections such as RGB, thermistors, etc. They all should be commented out.

!!! tip "Toolhead Boards"
    If you were already running a toolhead board, it's likely these sections are all in a separate file. You can simply comment out the include for that file in your printer.cfg.

## Homing Sections

klipper-toolchanger uses the tool's probe for Z homing. `[stepper_z]` section needs to be updated:

* Change `endstop_pin:` to use the virtual endstop:
    ```cfg
    endstop_pin: probe:z_virtual_endstop
    ```
* Remove `position_endstop:` as this is now determined by the [tool_probe Tn]

!!! warning "position_endstop"
    The `position_endstop:` parameter is incompatible with `probe:z_virtual_endstop` and must be removed to prevent configuration errors.


[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} has its own homing routine and requires any existing overrides to be disabled.

* [probe]
* [homing_override]
* [safe_z]

!!! info "[probe]"
    Because each tool now has its own OptoTap sensor, `[probe]` will be redefined as [[tool_probe]](../configuration/tool.md#tool_probe) and become part of your new [tool config](../configuration/tool.md).

## Print Start and Print End Macros
As soon as more than one toolhead is used, the `PRINT_START` and `PRINT_END` macros need to be updated. It is recommended to adjust them at this step already, so they are in place if additional toolheads are added. The following points should be added:

* Enabling crash detection (`START_CRASH_DETECTION`) before the print and disabling it for sequences where the tap mechanism is used, such as homing (`STOP_CRASH_DETECTION`)
* Changing to T0 (`T0`) for calibration (homing, quad-gantry-level, …)
  * Changing to T0 after the print is also recommended, so T0 is mounted again for homing and other calibration steps on the next print
* Switching to the initial printing toolhead and therefore accepting the parameter for first toolhead from the slicer
* Fully shutting down all toolheads after the print

The suggested G-Code can be found in the [examples](../examples.md).

## Saved Values
If you have any if the following saved values at the bottom of printer.cfg that were saved via the `SAVE_CONFIG` macro, they will need to be removed.

* [probe]
* [extruder]

With [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}, `SAVE_CONFIG` shouldn't be used for saving values. Using `SAVE_CONFIG` can cause conflicts with the [tool configs](../configuration/tool.md). The values should instead be entered in to the sections of their respective [tool config](../configuration/tool.md).