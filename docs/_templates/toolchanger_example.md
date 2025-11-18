=== "Toolchanger Config"
    ``` cfg { title="Example toolchanger-config.cfg" .copy }

    # enable Rounded Path
    [rounded_path]
    resolution: 0.2 # the length of a circle approximation segments.
    replace_g0: False # Use at your own risk

    # enable Force Move
    [force_move]
    enable_force_move: True

    [toolchanger]
    # Do not adjust the dropoff and pickup paths unless you know what they do.
    params_dropoff_path: [{'y':9.5 ,'z':4}, {'y':9.5, 'z':2}, {'y':5.5, 'z':0}, {'z':0, 'y':0, 'f':0.5}, {'z':-10, 'y':0}, {'z':-10, 'y':16}]
    params_pickup_path: [{'z':-10, 'y':16}, {'z':-10, 'y':0}, {'z':0, 'y':0, 'f':0.5, 'verify':1}, {'y':5.5, 'z':0}, {'y':9.5, 'z':2}, {'y':9.5 ,'z':4}]
    params_safe_y: 120 # The distance from absolute zero to the back of the tools in the dock. Allow some extra clearance.
    params_close_y: 30 # The relative distance from safe_y the gantry moves to while changing tools.
    params_fast_speed: 10000 # Movement speed while outside of the dock during tool changes.
    params_path_speed: 900 # Movement speed used for pickup and dropoff during tool changes.
    require_tool_present: True # Set to False to allow toolless movement. Toolless movement should be used with caution.

    # this section must be completed
    [gcode_macro homing_override_config]
    variable_sensorless_x: False
    variable_sensorless_y: False
    variable_homing_rebound_y: 0 # for sensorless you probably want this set to 20.
    variable_stepper_driver: "tmc2209"
    variable_homing_current: 0.49

    # M109 macro is overridden to allow some deadband on the temp
    # default is +- 1 degree.  So if the set temp is 250 the the default
    # deadband will be 249-251.  You can adjust this here:
    # [gcode_macro SET_TEMPERATURE_WITH_DEADBAND]
    # variable_default_deadband: 4.0

    # these values need to be set to match the location of your Calibration Switch
    # positions are from absolute zero (front left corner of the bed)
    # only required if you have a calibration probe.
    # [gcode_macro _CALIBRATION_SWITCH]
    # variable_x: 227.471875
    # variable_y: 353.703125
    # variable_z: 5.00
    # gcode:

    # only required if you have a calibration probe.
    # must be disabled if using Axiscope for calibration of Z
    # [tools_calibrate]
    # pin:   #pin that your calibration probe is connected to.
    # travel_speed: 20  # mms to travel sideways for XY probing
    # spread: 7  # mms to travel down from top for XY probing
    # lower_z: 1.0  # The speed (in mm/sec) to move tools down onto the probe
    # speed: 2  # The speed (in mm/sec) to retract between probes
    # lift_speed: 4  # Z Lift after probing done, should be greater than any Z variance between tools
    # final_lift_z: 6 
    # sample_retract_dist:2
    # samples_tolerance:0.05
    # samples:5
    # samples_result: median # median, average
    #  Settings for nozzle probe calibration - optional.
    # probe: probe # name of the nozzle probe to use
    # trigger_to_bottom_z: 0.25 # Offset from probe trigger to vertical motion bottoms out. 
    ```