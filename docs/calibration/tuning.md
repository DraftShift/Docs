
## Resonance
Typically, each toolhead board will have its own accelerometer for resonance testing. 
Each accelerometer needs to be given a unique name in Klipper so that it can be called directly.

``` cfg title="Example of tool's Nitehawk36 ADXL345 configuration."
[adxl345 T0]
cs_pin: NHK0:gpio27
spi_software_sclk_pin: NHK0:gpio18
spi_software_mosi_pin: NHK0:gpio20
spi_software_miso_pin: NHK0:gpio19
axes_map: x,z,y
```

Klipper's [[resonance_tester]](https://www.klipper3d.org/Config_Reference.html#resonance_tester){target="_blank"} module only supports a single `accel_chip` to be set at a time. This means that any time you want to run input shaper, the accelerometer chip needs to be defined to ensure the correct toolhead board is being used. 

You can swap the accelerometer manually by changing the `accel_chip` in [[resonance_tester]](https://www.klipper3d.org/Config_Reference.html#resonance_tester){target="_blank"}.

``` cfg hl_lines="4" title="Example [input_shaper] & [resonance_tester] sections."
[input_shaper]

[resonance_tester]
accel_chip: adxl345 T0
probe_points: 175,175,20
sweeping_accel: 400
sweeping_period: 0
```

To run input shaper without changing the `accel_chip` in [[resonance_tester]](https://www.klipper3d.org/Config_Reference.html#resonance_tester){target="_blank"}, you can specify the accelerometer in the macro's parameters.

``` lua { .copy title="Shaketune input shaper example." }
AXES_SHAPER_CALIBRATION ACCEL_CHIP="'adxl345 T0'"
```

### Applying the Results
Each tool can have the frequency and shaper type defined for the X and Y axes in the [[tool Tn]](../software/ktc-easy/configuration/tool.md#tool) section by adding `params_input_shaper_freq_x`, `params_input_shaper_type_x`, `params_input_shaper_freq_y` and `params_input_shaper_type_y`.

``` cfg hl_lines="12 13 14 15" title="Example [tool Tn] section with input shaper"
[tool T0]
tool_number: 0
extruder: extruder
fan: T0_partfan
params_park_x: 5.0   # The absolute X-position of the tool in its dock.
params_park_y: 10.8  # The absolute Y-position of the tool in its dock.
params_park_z: 264.4 # The absolute Z-position where the tool and shuttle mate in the dock,determined when the TAP (or Z-probe) triggers.
gcode_x_offset: 0 # The X-Axis offset of the nozzle's orifice in relation to tool 0
gcode_y_offset: 0 # The Y-Axis offset of the nozzle's orifice in relation to tool 0
gcode_z_offset: 0 # The Z-Axis offset of the nozzle's orifice in relation to tool 0

params_input_shaper_freq_x: 62.2
params_input_shaper_type_x: 'ei'
params_input_shaper_freq_y: 41.0
params_input_shaper_type_y: 'mzv'

```

## Tool Change Speed
The speed of a tool change is determined by multiple factors.

1. The size of the printer.
2. The quality of componants used.
3. The power given to the motors.
4. `max_velocity` in the `[printer]` section.
5. `max_accel` in the `[printer]` section.
6. `max_z_velocity` in the `[printer]` section.
7. `max_z_accel` in the `[printer]` section.
8. `params_fast_speed` in the `[toolchanger]` section.
9. `params_path_speed` in the `[toolchanger]` section.

The first 2 are choices made while building your printer, make sure to use quality motors and rails from reputable sources. The third depends on which PSU and motor drivers you have, and the rest are all settings that need to be tuned.

### Determining Power
Typically, a good starting point for the `run_current` of your motors is to use 40% of the motor's rated current. For example, if your motor is rated to 2a, `2*0.4=0.8`. Your starting `run_current` would be `0.8`. This can vary depending on the motor or manufacturer, but whether your running 24 or 48 volts, 40% of the motors rated current should yeild good results. 

Increasing the `run_current` could enable faster tool changes, but should be done with caution.

!!! danger "Hot Hot Hot"
    Voron 2.4 motor mounts are made from printed plastic. If they get too hot they will deform, causing catastrophic failure.

    When increasing the `run_current` of your motors, make sure to monitor the temperature of the motors during operation. If the temperature starts to get too hot, reduce the `run_current` and monitor the temperature again.

For more information on tuning your `run_current`, consult [Ellis' Print Tuning guide](https://ellis3dp.com/Print-Tuning-Guide/articles/determining_motor_currents.html){target="_blank"}.

### max_velocity and max_accel
`max_velocity` and `max_accel` are typically tuned as part of standard printer build and determine the maximum limit of how fast your printer can accelerate and move in the the XY axis.

For more information on `max_velocity` and `max_accel`, consult [Ellis' Print Tuning guide](https://ellis3dp.com/Print-Tuning-Guide/articles/determining_max_speeds_accels.html){target="_blank"}.

### max_z_velocity and max_z_accel
`max_z_velocity` and `max_z_accel` are typically overlooked on a standard printer build, but are rather important for StealthChanger. They determine the maximum limit of how fast your printer can accelerate and move in the the Z axis.

The standard Voron 2.4 example configurations are intentionally conservative regarding gantry Z movement speeds—and for good reason. If any one of the four Z-axis motors were to skip steps while the others continue to move, the gantry would become racked.

With StealthChanger, the gantry operates at significantly higher speeds than most stock configurations. If a Z-axis motor were to skip at these elevated speeds, the resulting misalignment of the gantry corners could be severe enough to cause significant damage to the gantry.

!!! warning "Flying too close to the sun"
    This is an example of what could happen if you tune you coinfiguration too high for the hardware you are using. Thanks to fireishott on Discord for the image.

    ![fireishot](../assets/fireishott.jpg)

#### Increasing Z speeds
Increasing the `max_z_velocity` and `max_z_accel` values should only be done once you are able to do tool changes and should be done in small increments.

``` cfg title="[printer] section example."
[printer]
kinematics: corexy
max_velocity: 300
max_accel: 3000
max_z_velocity: 100
max_z_accel: 1000 # Start with 500 for G2Z.
square_corner_velocity: 5.0
```

- Increase your `max_z_accel` in increments of 100-200 at a time. Test with multiple tool changes between increments.
- Increase your `max_z_velocity` in increments of 25-50 at a time. Test with multiple tool changes between increments.
- Reference [Prusa's Max Speed Calculator](https://blog.prusa3d.com/calculator_3416/#speed){target="_blank"} for a visual on how the values will be applied.

### params_fast_speed and params_path_speed
`params_fast_speed` and `params_path_speed` are klipper-toolchanger's way of limiting the speeds used for tool changes and are located in the [`[toolchanger]`](../software/ktc-easy/configuration/toolchanger.md#toolchanger) section of the [toolchanger-config](../software/ktc-easy/configuration/toolchanger.md). 

- `params_fast_speed` clamps the all movements to the dock at it's set value.
- `params_path_speed` clamps the all of the pickup or dropoff movements within the dock at it's set value.

``` cfg hl_lines="8 9" title="[printer] section example."
[toolchanger]
# These paths have been verified to work with StealthChanger with ModularDock, it should not be changed unless you understand what you are doing.
params_dropoff_path: [{'y':9.5 ,'z':4}, {'y':9.5, 'z':2}, {'y':5.5, 'z':0}, {'z':0, 'y':0, 'f':0.5}, {'z':-10, 'y':0}, {'z':-10, 'y':16}]
params_pickup_path: [{'z':-10, 'y':16}, {'z':-10, 'y':0}, {'z':0, 'y':0, 'f':0.5, 'verify':1}, {'y':5.5, 'z':0}, {'y':9.5, 'z':2}, {'y':9.5 ,'z':4}]

params_safe_y: 120 # The distance from absolute zero to the back of the tools in the dock. Allow some extra clearance.
params_close_y: 30 # The relative distance from safe_y the gantry moves to while changing tools.
params_fast_speed: 10000 # Movement speed while outside of the dock during tool changes.
params_path_speed: 900 # Movement speed used for pickup and dropoff during tool changes.
```

Increasing these values will result in faster tool change movement up to the point of reaching your `max_velocity`, `max_accel`, `max_z_velocity` and `max_z_accel` values. The `max_velocity`, `max_accel`, `max_z_velocity` and `max_z_accel` values will be used if `params_fast_speed` or `params_path_speed` exceeds them.

### Deminishing Returns
After tuning all of your currents and speeds, a typical Voron 2.4 should be capable of tool changes that are less than 10 seconds from the bed and back. 

With specialized hardware, faster speeds can be achieved, but you get to the point where there is little to no benifit. As per [Prusa's Max Speed Calculator](https://blog.prusa3d.com/calculator_3416/#speed), you can only accelerate so fast until reaching the maximum velocity. With the size of the standard Voron 2.4 being 350mm or less, you start to be limited by the time it takes to actually pickup the tool. 

You need to allow enough time for the StealthChanger Shuttle and Backplate to engage cleanly and the OptoTap sensor to detect the presence of the Backplate. Klipper-toolchanger has hardcoded pauses to allow for these things to happen reliably and can not be adjusted by the end user.