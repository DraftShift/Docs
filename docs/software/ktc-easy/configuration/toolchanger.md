
The toolchanger-config sets up the main toolchanger object as well as homing and tool calibration. It is important to have an understanding of each section and they effect the base klipper installation.

!!! note "Reference Examples"
    The following sections are for reference only. The contetnts of the reference examples may differ from your config. For complete examples, please reference the [Examples](../examples.md) page.

## [rounded_path]
Rounded path gives non-printing G-code moves calculated rounded corners to minimize jerk and increase toolchange times. 

``` cfg
[rounded_path]
resolution: 0.2
replace_g0: False
```

## [force_move]
[Force move](https://www.klipper3d.org/Config_Reference.html?h=force_move#force_move){:target="_blank"} is built-in to [Klipper](https://www.klipper3d.org/){:target="_blank"} and is required to be enabled for [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}.

``` cfg
[force_move]
enable_force_move: True
```

## [toolchanger]
The `[toolchanger]` section enables the tool changing capability and contains variables specific to changing tools.

``` cfg
[toolchanger]
# These paths have been verified to work with StealthChanger with ModularDock, it should not be changed unless you understand what you are doing.
params_dropoff_path: [{'y':9.5 ,'z':4}, {'y':9.5, 'z':2}, {'y':5.5, 'z':0}, {'z':0, 'y':0, 'f':0.5}, {'z':-10, 'y':0}, {'z':-10, 'y':16}]
params_pickup_path: [{'z':-10, 'y':16}, {'z':-10, 'y':0}, {'z':0, 'y':0, 'f':0.5, 'verify':1}, {'y':5.5, 'z':0}, {'y':9.5, 'z':2}, {'y':9.5 ,'z':4}]

params_safe_y: 120 # The distance from absolute zero to the back of the tools in the dock. Allow some extra clearance.
params_close_y: 30 # The relative distance from safe_y the gantry moves to while changing tools.
params_fast_speed: 10000 # Movement speed while outside of the dock during tool changes.
params_path_speed: 900 # Movement speed used for pickup and dropoff during tool changes.
require_tool_present: True # Set to False to allow toolless movement. Toolless movement should be used with caution.
```

!!! info "Info"
    Further information on the [toolchanger] section can be found in the [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/toolchanger.md#toolchanger){:target="_blank"} documentation.

## [gcode_macro homing_override_config]
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} has its own homing routine that homes the Y axis first which allows the tool on the shuttle to be clear of the umbilical cables before homing the X axis. 

`homing_override_config` variables can be used to switch between sensorless and endstop homing.

``` cfg
[gcode_macro homing_override_config]
variable_sensorless_x: False # Enable for sensorless homing on X axis
variable_sensorless_y: False # Enable for sensorless homing on Y axis
variable_homing_rebound_y: 0 # for sensorless you probably want this set to 20.
variable_stepper_driver: "tmc2209"
variable_homing_current: 0.49
```

## [gcode_macro SET_TEMPERATURE_WITH_DEADBAND]
Adjusting the default deadband will change the precision required when using the `M109` macro.

!!! tip "Deadband?"
    Deadband defines the acceptable temperature range around the target setpoint within which the printer considers the temperature “close enough” to proceed. For example, with a deadband value of 4, the printer will continue operation once the actual temperature is within ±2 °C of the target. 
    
    * Increasing the deadband can allow faster tool change times, but reduces temperature precision. 
    * Decreasing the deadband improves accuracy at the cost of longer stabilization times.

``` cfg
[gcode_macro SET_TEMPERATURE_WITH_DEADBAND]
variable_default_deadband: 4.0 
```

## [gcode_macro _CALIBRATION_SWITCH]
Change the `_CALIBRATION_SWITCH` macro variables to the absolute position of the top of your multi axis calibration probe. 

This section is optional and only required if you are using a calibration probe.

``` cfg
[gcode_macro _CALIBRATION_SWITCH]
variable_x: 227.471875
variable_y: 353.703125
variable_z: 5.00
gcode:
```

## [tools_calibrate]
Defining the `[tools_calibrate]` section enables the multi axis probe calibration. Change the variables to match your requirements.

This section is optional and only required if you are using an automated calibration probe such as [SexBall Probe](../../../hardware/calibration_tools.md#sexball-probe).

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
