
Before running [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}, you’ll need to make a few changes to your existing Klipper configuration. This involves removing or commenting out certain sections that may conflict with [Klipper-toolchanger-easy's](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} framework, and introducing new configurations for toolchanger specific functions.

These changes ensure that [Klipper](#) and [klipper-toolchanger-easy](#) work together correctly. Detailed instructions are provided in the setup steps below — it’s important to follow them carefully to avoid duplicate or conflicting settings.

## Redundant Klipper Sections
In order for [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} to operate, some of your existing config will either be made redundant or need to be transferred in to a tool config file.

### Toolhead Sections
Everything related to the toolhead will be moved in to a [tool config](#) file or made redundant. For now, its easier to comment these items out so you can reference them later if required.

* [mcu mcu_name]
* [extruder]
* [tmc2209 extruder]
* [adxl345]
* [fan]
* [heater_fan]

There may be more sections such as RGB, thermistors, etc. They all should be commented out.

!!! tip "Toolhead Boards"
    If you were already running a toolhead board, its likely these sections are all in a separate file. You can simply comment out the include in printer.cfg.

### Homing Sections
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} has its own homing routine and requires any existing overrides to be disabled.

* [probe]
* [homing_override]
* [safe_z]

!!! info "[probe]"
    Because each tool now has a TAP sensor, `[probe]` will be redefined as [[tool_probe]](#) and become part of your [tool config](#).

### Saved Values
If you have any if the following saved values at the bottom of printer.cfg that were saved via the `SAVE_CONFIG` macro, they will need to be removed.

* [probe]
* [extruder]

With [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} `SAVE_CONFIG` can no longer be used for saving values. The values should instead be entered in to the sections of their respective [tool config](#).

## Preparing for Launch

[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} splits it's configuration in to 2 main segments, the [Toolchanger Config](#) which contains the configurations for toolchanger specific settings and [Tool Configs](#) which contain the configuration for each toolhead. 

### Toolchanger Configuration
The toolchanger-config sets up the main toolchanger object as well as homing and tool calibration. It is important to have an understanding of each section and they effect the base klipper installation.

<br>

#### [rounded_path]
Rounded path gives non-printing gcode moves calculated rounded corners to minimize jerk and increase toolchange times. 

``` cfg
[rounded_path]
resolution: 0.2
replace_g0: False
```

<br>

#### [force_move]
!!! warning "TODO"
    check if this is actually needed on easy

[Force move](#){:target="_blank"} is built-in to [Klipper](#){:target="_blank"} and is required to be enabled for [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}.

``` cfg
[force_move]
enable_force_move: True
```

<br>

#### [toolchanger]
The `[toolchanger]` section enables the tool changing capability and contains variables specific to changing tools.

``` cfg
[toolchanger]
# These paths have been verified to work with StealthChanger and should not be changed unless you understand what you are doing.
params_dropoff_path: [{'y':9.5 ,'z':4}, {'y':9.5, 'z':2}, {'y':5.5, 'z':0}, {'z':0, 'y':0, 'f':0.5}, {'z':-10, 'y':0}, {'z':-10, 'y':16}]
params_pickup_path: [{'z':-10, 'y':16}, {'z':-10, 'y':0}, {'z':0, 'y':0, 'f':0.5, 'verify':1}, {'y':5.5, 'z':0}, {'y':9.5, 'z':2}, {'y':9.5 ,'z':4}]

params_safe_y: 120 # The distance from absolute zero to the back of the tools in the dock. Allow some extra clearance.
params_close_y: 30 # The relative distance from safe_y the gantry moves to while changing tools.
params_fast_speed: 10000 # Movement speed while outside of the dock during tool changes.
params_path_speed: 900 # Movement speed used for pickup and dropoff during tool changes.
require_tool_present: True # Set to False to allow toolless movement. Toolless movement should be used with caution.
```

!!! info "Info"
    Further information can be found in the [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} documentation.

<br>

#### [gcode_macro homing_override_config]
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} has its own homing routine which homes Y first for umbilical clearance. `homing_override_config` variables can be used to switch between sensorless and endstop homing.

``` cfg
[gcode_macro homing_override_config]
variable_sensorless_x: False # Enable for sensorless homing on X axis
variable_sensorless_y: False # Enable for sensorless homing on Y axis
variable_homing_rebound_y: 0 # for sensorless you probably want this set to 20.
variable_stepper_driver: "tmc2209"
variable_homing_current: 0.49
```

<br>

#### [gcode_macro SET_TEMPERATURE_WITH_DEADBAND]
Adjusting the default deadband will change the precision required when using the `M109` macro.

!!! tip "Deadband?"
    Deadband defines the acceptable temperature range around the target setpoint within which the printer considers the temperature “close enough” to proceed. For example, with a deadband value of 4, the printer will continue operation once the actual temperature is within ±2 °C of the target. 
    
    * Increasing the deadband can allow faster tool change times but reduces temperature precision. 
    * Decreasing the deadband improves accuracy at the cost of longer stabilization times.

``` cfg
[gcode_macro SET_TEMPERATURE_WITH_DEADBAND]
variable_default_deadband: 4.0 
```

<br>

#### [gcode_macro _CALIBRATION_SWITCH]
Change the `_CALIBRATION_SWITCH` macro variables to the absolute position of the top of your multi axis calibration probe. 

This section is optional and only required if you are using a calibration probe.

``` cfg
[gcode_macro _CALIBRATION_SWITCH]
variable_x: 227.471875
variable_y: 353.703125
variable_z: 5.00
gcode:
```

<br>

#### [tools_calibrate]
Defining the [tools_calibrate] section enables the multi axis probe calibration. Change the variables to match your requirements.

This section is optional and only required if you are using a calibration probe.

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

<br>

### Tool Configuration
Each tool has its own configuration file, stored by default in `~/printer_data/config/toolchanger/tools/`. These files should be named according to the tool’s index — for example, `T0.cfg`, `T1.cfg`, and so on. This structure keeps configurations organized and makes it easy to manage settings for individual tools.

!!! tip "Don't be too hasty"
    It’s a good idea to start by setting up a single tool (T0.cfg) first. Getting one toolhead working correctly helps identify and resolve any setup issues before applying the same configuration to additional tools.

As a minimum, the following sections are required in a tool config:

* [mcu]
* [extruder]
* [tmc2209]
* [heater_fan]
* [fan_generic]
* [tool]
* [tool_probe]
* [gcode_macro Tn]

<br>

#### [mcu]
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

<br>

#### [extruder]
The extruder section is much the same as your typical Klipper [extruder](#){:target="_blank} section with the exception of tools that are not T0 requiring a tool number attached to them.

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

<br>

#### [tmc2209]
Behaves exactly like a typical [[tmc2209]](#){:target="_blank} section.

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

<br>

#### [heater_fan]
Behaves exactly like a typical Klipper [[heater_fan]](#){:target="_blank} section.

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

<br>

#### [fan_generic]
This is a point where klipper-toolchanger differs from regular Klipper. To be able to control a tool's part cooling fans while it is not in use, klipper-toolchanger uses [[fan_generic]](#) rather than [[fan]](#){:target="_blank"}.

!!! warning "[fan]"
    Using [[fan_generic]](#){:target="_blank"} replaces the need for a [[fan]](#){:target="_blank"} section in your config. If you have an existing [[fan]](#){:target="_blank"} section, it must be removed.

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

<br>

#### [tool]
The [[tool]](#) section is a klipper-toolchanger extension that is used to attach all the preceding sections and calibration values to a [tool object](#) that klipper-toolchanger references.

!!! note "Offset and Park Values"
    The `gcode_[xyz]_offset` and `params_park_[xyz]` values should all default to zero. They are values that need to be calibrated. 

=== "T0"
    ``` cfg title="Tool 0 Config"
    [tool T0]
    tool_number: 0
    extruder: extruder
    fan: T0_part_fan
    # detection_pin: # Only required for non TAP probing.
    gcode_x_offset: 0
    gcode_y_offset: 0
    gcode_z_offset: 0
    params_park_x: 0
    params_park_y: 0
    params_park_z: 0
    ```

=== "T1"
    ``` cfg title="Tool 1 Config"
    [tool T1]
    tool_number: 1
    extruder: extruder1
    fan: T1_part_fan
    # detection_pin: # Only required for non TAP probing.
    gcode_x_offset: 0
    gcode_y_offset: 0
    gcode_z_offset: 0
    params_park_x: 0
    params_park_y: 0
    params_park_z: 0
    ```

!!! example "Alternate probing"
    If you are using a probing method other than [[tool_probe]](#tool_probe), the `detection_pin` variable must also be set with the pin for the tool's tap sensor.

!!! info "Info"
    Further information can be found in the [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} documentation.

<br>

#### [tool_probe]
The [[tool_probe]](#){:target="_blank"} section is a klipper-toolchanger extension that attaches a probe to the [tool object](#){:target="_blank"}. This gives each tool the ability to be used as a tap probe and is also used to detect which tool is on the [Shuttle](#).

!!! warning "[probe]"
    Using [[tool_probe]](#){:target="_blank"} replaces the need for a [[probe]](#){:target="_blank"} section in your config. If you have an existing [[probe]](#){:target="_blank"} section, it must be removed.

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
    Further information can be found in the [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} documentation.

<br>

#### [gcode_macro Tn]
Each tool gets assigned a [gcode_macro](#){:target="_blank"} which is used to call a change to that tool.

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

<br>

### Includes

Add the following to the start of your `printer.cfg`
``` cfg
[include toolchanger/readonly-configs/toolchanger-include.cfg]
```

<br>

## Post Configuration
Once you have gone through the [toolchanger-config](#), [tool config](#) and include steps, you should now have a functional printer. 

!!! failure "Klipper Error"
    If you are experiencing Klipper errors, please consult [Software Troubleshooting](#).

### Pre Launch
At this point it is advised to get the printer printing with tool 0 before continuing configuration of everything else. Before homing and starting a print, there are some checks we should do to make sure everything behaves as intended.

<br>

#### Hardware Checks
Make sure your toolhead passes all of the checks before continuing.

1. When you place the tool on the shuttle the TAP sensor triggers its LED.
2. The part cooling fans turn on with `M106 S127` and off with `M107`.
3. The hotend heats up and the hotend fan turn on with `M104 S200`.
4. Once at temperature, the extruder motor moves with `G1 E100 F100`.
5. finally, Turn the hotend off with `M104 S0`

If any of these steps fails, the issue could be either hardware or software related. Consult the [Hardware Troubleshooting](#) and [Software Troubleshooting].

!!! danger "TODO"
    We should make sure that each of these tests are representing in the troubleshooting guides for both hardware and software.

<br>

#### Tool detection and homing
1. Check that the tool detection is working by running `INITIALIZE_TOOLCHANGER` with and without the tool on the shuttle. You should get confirmation that the tool was/wasn't detected.
2. With the tool on the shuttle, home the Y axis by running `G28 Y`.
3. Run `G28 X`.
4. Run `G28 Z`.

!!! success
    At this point the printer should be homed and everything is running as intended. 
    
    If you have any issues initializing or homing, please consult [Software Troubleshooting](#).

<br>

#### Backplate Break In
Because Steathchanger's action requires high tolerance mating of pins and bushings, its good idea to run the action repeatedly to help break in the componants. This break in proceedure should be done for every tool.

!!! danger "TODO"
    Figure out a method that also supports eddy current sensors.

1. Heatsoak your printer.
2. Run `G28`
3. Run `QUAD_GANTRY_LEVEL`
3. Run `G28 Z`
2. Run `PROBE_ACCURACY SAMPLES=100`

!!! failure "Failure"
    If you experience failure during this step or you feel the accuracy is not as good as it should be, consult the [troubleshooting](#) section.

Please reference the [Tool Calibration](#).

<br>

#### Probe offset
The last step before being able to print again is to calibrate your probe offsets. This procedure is different depending on whether you are using TAP or an Eddy current sensor for probing.

=== "TAP"
    1. Home the printer with `G28`.
    2. Run `QUAD_GANTRY_LEVEL`.
    3. Run `G28 Z`.
    4. Run `PROBE_CALIBRATE`.
    5. Change the `z_offset` variable in the tool's [[tool_probe]](#) section.

    !!! caution "SAVE_CONFIG"
        Because klipper-toolchanger-easy reroutes probe to each tool object, when you run `SAVE_CONFIG` it saves the values to `[probe]`. Having a `[probe]` section in your config while also having `[tool_probe]` will cause issues with Klipper. `SAVE_CONFIG` should be avoided.

        If you do save the values, you will need to move the offset from the bottom of `printer.cfg` to your tools `[tool_probe]` section.


=== "Eddy Current"
    Set the probe offset as per your Sensor's documentation.

<br>

### First Print
If you copied your [extruder] values from a previous config, you are ready for your first print. If your setting up the printer for the first time, you may need to PID tune your hotend and tune your extruder first.

!!! tip "Extruder Tuning"
    For PID tuning we recommend [Voron's PID Tuning Guide](https://docs.vorondesign.com/build/startup/startup.html?model=v2&step=11&interface=mainsail&probe=tap){:target="_blank"}.

    For extruder calibration we recommend [Ellis' Extruder Calibration Guide](https://ellis3dp.com/Print-Tuning-Guide/articles/extruder_calibration.html){:target="_blank"}.

Run a print as you would for any standard printer first print. As long as the tool is on the shuttle, the printer will behave as any other TAP based printer.

!!! question "Is that it?"
    Getting a single tool printing is much the same as any other printer. We shouldnt bother ourselves with any tool offsets or park positions just yet.

<br>

## Adding Subsequent Tools
Adding more tool configs is much like configuring T0. You create a [tool config](#) and fill it with the required values. If your tools are all using similar hardware, it can be much quicker to copy your existing [tool config](#) and rename `Tn.cfg`.

!!! note "Numbering"
    [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} requires the tools to be numbered sequentially. If you only have `T0.cfg` you next [tool config](#) must be `T1.cfg`.

    The following items need to be incremented:

    * `[mcu]` section name and the serial/canbus id. All references to the MCU name's pins also need to be changed. 
    * `[extruder]` section name.
    * `[tmc2209]` section name.
    * `[heater_fan]` section name and its `heater` variable.
    * `[generic_fan]` section name.
    * `[tool]` section name and its `tool_number`, `extruder` and `fan` variables.
    * `[tool_probe]` name and its `tool` and `activate_gcode` variables.
    * `[gcode_macro Tn]` and its `gcode` variable.

    If you have any extra sections such as RGB, adxl, etc. They will also need to be incremented.

!!! warning "Calibrated Values"
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

[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} makes adding more tools and getting them to work with klipper is a rather simple process. At this point the tools should show up in the UI and you should be able to control the heaters, fans and so on. However, there are more steps required to get the printer to change tools.

Go through the [Pre Launch](#pre-launch) steps again for each additional tool, optionally excluding the [Probe offset](#probe-offset) calibration and [First Print](#first-print) test.

!!! tip "Probe Offsets for Subsequent Tools"
    All tool offsets are calibrated relative to T0. Setting probe offsets for tools other than T0 is generally only useful if you need to home using that specific tool. However, even if another tool is used for homing, it’s recommended to home T0 again before starting a print to ensure consistent alignment and accuracy.

With the tools broken in and functioning corrently, we can move on to [Calibration](#).
