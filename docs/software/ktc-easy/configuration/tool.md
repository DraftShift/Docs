
Each tool has its own configuration file, stored by default in `~/printer_data/config/toolchanger/tools/`. 

These files should be named according to the tool’s index — for example, `T0.cfg`, `T1.cfg`, and so on. This structure keeps configurations organized and makes it easy to manage settings for individual tools.

!!! tip "Don't be too hasty"
    It’s a good idea to start by setting up a single tool (T0.cfg) first. Getting one toolhead working correctly helps identify and resolve any issues before applying the same configuration to additional tools.

As a minimum, the following sections are required in a tool config:

* [mcu]
* [extruder]
* [tmc2209]
* [heater_fan]
* [fan_generic]
* [tool]
* [tool_probe]
* [gcode_macro Tn]

!!! note "Reference Examples"
    The following sections are for reference only. The contetnts of the reference examples may differ from your config. For complete examples, please reference the [Examples](../examples.md) page.

## [mcu]
Each toolhead board requires a unique MCU name. Typically you would give them a descriptive name followed by the respective tool number.

=== "T0" 
    ``` cfg title="Tool 0 Config"
    [mcu NHK0]
    serial: /dev/serial/by-id/usb-Klipper_rp2040_xxxxxxxxxxxxxxxx-xxxx
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [mcu NHK1]
    serial: /dev/serial/by-id/usb-Klipper_rp2040_xxxxxxxxxxxxxxxx-xxxx
    ```

## [extruder]
The extruder section is much the same as your typical Klipper [extruder](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#extruder){:target="_blank} section with the exception of tools that are not T0 requiring a tool number attached to them.

=== "T0"
    ``` cfg title="Tool 0 Config"
    [extruder]
    step_pin: NHK0:gpio23
    dir_pin: !NHK0:gpio24
    enable_pin: !NHK0:gpio25
    heater_pin: NHK0:gpio9
    sensor_pin: NHK0:gpio29
    microsteps: 16
    sensor_type: ATC Semitec 104NT-4-R025H42G
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [extruder1]
    step_pin: NHK1:gpio23
    dir_pin: !NHK1:gpio24
    enable_pin: !NHK1:gpio25
    heater_pin: NHK1:gpio9
    sensor_pin: NHK1:gpio29
    microsteps: 16
    sensor_type: ATC Semitec 104NT-4-R025H42G
    ```

## [tmc2209]
Behaves exactly like a typical [[tmc2209]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#tmc2209){:target="_blank} section.

=== "T0"
    ``` cfg title="Tool 0 Config"
    [tmc2209 extruder]
    uart_pin: NHK0:gpio0
    tx_pin: NHK0:gpio1
    sense_resistor: 0.1
    interpolate: False
    stealthchop_threshold: 0
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [tmc2209 extruder1]
    uart_pin: NHK1:gpio0
    tx_pin: NHK1:gpio1
    sense_resistor: 0.1
    interpolate: False
    stealthchop_threshold: 0
    ```

## [heater_fan]
Behaves exactly like a typical Klipper [[heater_fan]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#heater_fan){:target="_blank} section.

=== "T0"
    ``` cfg title="Tool 0 Config"
    [heater_fan T0_hotend_fan]
    pin: NHK0:gpio5
    kick_start_time: 0.5
    heater_temp: 50.0
    heater: extruder
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [heater_fan T1_hotend_fan]
    pin: NHK1:gpio5
    kick_start_time: 0.5
    heater_temp: 50.0
    heater: extruder1
    ```

## [fan_generic]
To be able to control a tool's part cooling fans while it is not in use, klipper-toolchanger uses [[fan_generic]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#fan_generic) rather than [[fan]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#fan){:target="_blank"}.

!!! warning "[fan]"
    Using [[fan_generic]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#fan_generic){:target="_blank"} replaces the need for a [[fan]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#fan){:target="_blank"} section in your config. If you have an existing [[fan]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#fan){:target="_blank"} section, it must be removed.

=== "T0"
    ``` cfg title="Tool 0 Config"
    [fan_generic T0_part_fan]
    pin: NHK0:gpio6
    kick_start_time: 0.5
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [fan_generic T1_part_fan]
    pin: NHK1:gpio6
    kick_start_time: 0.5
    ```

## [tool]
The [[tool]](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/toolchanger.md#tool) section is a [klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy/){:target="_blank"} extension that is used to attach all the preceding sections and calibration values to a tool object that [klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy/){:target="_blank"} references.

!!! note "Offset and Park Values"
    The `gcode_[xyz]_offset` and `params_park_[xyz]` values should all default to zero. They are values that need to be calibrated. 

=== "T0"
    ``` cfg title="Tool 0 Config"
    [tool T0]
    tool_number: 0 # change to the index of the tool. 0, 1, 2, etc.
    extruder: extruder # change to match the extruder you are configuring: extruder, extruder1, etc.
    fan: T0_part_fan
    # detection_pin: # Only required for non TAP probing.
    params_park_x: 0 # The absolute X-position of the tool in its dock.
    params_park_y: 0 # The absolute Y-position of the tool in its dock.
    params_park_z: 0 # The absolute Z-position where the tool and shuttle mate in the dock, determined when the TAP (or Z-probe) triggers.
    gcode_x_offset: 0 # The X-Axis offset of the nozzle's orifice in relation to tool 0
    gcode_y_offset: 0 # The Y-Axis offset of the nozzle's orifice in relation to tool 0
    gcode_z_offset: 0 # The Z-Axis offset of the nozzle's orifice in relation to tool 0
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [tool T1]
    tool_number: 1 # change to the index of the tool. 0, 1, 2, etc.
    extruder: extruder1 # change to match the extruder you are configuring: extruder, extruder1, etc.
    fan: T1_part_fan
    # detection_pin: # Only required for non TAP probing.
    params_park_x: 0 # The absolute X-position of the tool in its dock.
    params_park_y: 0 # The absolute Y-position of the tool in its dock.
    params_park_z: 0 # The absolute Z-position where the tool and shuttle mate in the dock, determined when the TAP (or Z-probe) triggers.
    gcode_x_offset: 0 # The X-Axis offset of the nozzle's orifice in relation to tool 0
    gcode_y_offset: 0 # The Y-Axis offset of the nozzle's orifice in relation to tool 0
    gcode_z_offset: 0 # The Z-Axis offset of the nozzle's orifice in relation to tool 0
    ```

!!! example "Alternate probing"
    If you are using a probing method other than TAP, the `detection_pin` variable must also be set with the pin for the tool's tap sensor.

!!! info "Info"
    Further information on the [[tool]](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/toolchanger.md#tool){:target="_blank"} section can be found in the [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} documentation.

## [tool_probe]
The [[tool_probe]](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/tool_probe.md#tool-probe){:target="_blank"} section is a klipper-toolchanger extension that attaches a probe to the [tool object](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/toolchanger.md#tool){:target="_blank"}. This gives each tool the ability to be used as a TAP probe and is also used to detect which tool is on the [Shuttle](../../../hardware/stealthchanger.md#shuttle).

!!! warning "[probe]"
    Using [[tool_probe]](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/tool_probe.md#tool-probe){:target="_blank"} replaces the need for a [[probe]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#probe){:target="_blank"} section in your config. If you have an existing [[probe]](https://www.klipper3d.org/Config_Reference.html?h=tmc2209#probe){:target="_blank"} section, it must be removed.

=== "T0"
    ``` cfg title="Tool 0 Config"
    [tool_probe T0]
    pin: ^NHK0:gpio10
    tool: 0
    z_offset: 0
    speed: 8
    samples: 3
    samples_result: median
    sample_retract_dist: 2
    lift_speed: 5
    samples_tolerance: 0.006
    samples_tolerance_retries: 3
    activate_gcode: _TAP_PROBE_ACTIVATE HEATER=extruder
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [tool_probe T1]
    pin: ^NHK1:gpio10
    tool: 1
    z_offset: 0
    speed: 8
    samples: 3
    samples_result: median
    sample_retract_dist: 2
    lift_speed: 5
    samples_tolerance: 0.006
    samples_tolerance_retries: 3
    activate_gcode: _TAP_PROBE_ACTIVATE HEATER=extruder1
    ```

!!! example "Alternative Probes"
    `[tool_probe]` should be disabled if using alternative probes, such as Eddy current sensors.

!!! info "Info"
    Further information on the [tool_probe](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/tool_probe.md#tool-probe){:target="_blank"} section can be found in the [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} documentation.

## [gcode_macro Tn]
Each tool gets assigned a [gcode_macro](https://www.klipper3d.org/Config_Reference.html#gcode_macro){:target="_blank"} which is used to call a change to that tool.

=== "T0"
    ``` cfg title="Tool 0 Config"
    [gcode_macro T0]
    variable_active: 0 # Do not change
    gcode: SELECT_TOOL T=0
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [gcode_macro T1]
    variable_active: 0 # Do not change
    gcode: SELECT_TOOL T=1
    ```
