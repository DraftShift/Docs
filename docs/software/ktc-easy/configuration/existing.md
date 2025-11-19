
In order for [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} to operate, some of your existing config will either be made redundant or need to be transferred in to a tool config file.

## Toolhead Sections
Everything related to the toolhead will be moved in to a [tool config](../configuration/tool.md) file or made redundant. For now, its easier to comment these items out so you can reference them later if required.

* [mcu mcu_name]
* [extruder]
* [tmc2209 extruder]
* [adxl345]
* [fan]
* [heater_fan]

There may be more sections such as RGB, thermistors, etc. They all should be commented out.

!!! tip "Toolhead Boards"
    If you were already running a toolhead board, its likely these sections are all in a separate file. You can simply comment out the include in printer.cfg.

## Homing Sections
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} has its own homing routine and requires any existing overrides to be disabled.

* [probe]
* [homing_override]
* [safe_z]

!!! info "[probe]"
    Because each tool now has a TAP sensor, `[probe]` will be redefined as [[tool_probe]](../configuration/tool.md#tool_probe) and become part of your [tool config](../configuration/tool.md).

## Saved Values
If you have any if the following saved values at the bottom of printer.cfg that were saved via the `SAVE_CONFIG` macro, they will need to be removed.

* [probe]
* [extruder]

With [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}, `SAVE_CONFIG` shouldn't be used for saving values. Using `SAVE_CONFIG` can cause conflicts with the [tool configs](../configuration/tool.md). The values should instead be entered in to the sections of their respective [tool config](../configuration/tool.md).