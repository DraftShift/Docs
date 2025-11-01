
## Example code blocks

```{ .bash .copy title="Install"}
cd ~/
git clone https://github.com/jwellman80/klipper-toolchanger-easy.git
cd ~/klipper-toolchanger-easy
./install.sh
```

=== "T0.cfg"
    ``` { .cfg .copy linenums="1" }
    [mcu EBB0]
    canbus_uuid: xxxxxxxxxxxx

    [adxl345 EBB0_adxl]
    cs_pin: EBB0:PB12
    spi_software_sclk_pin: EBB0:PB10
    spi_software_mosi_pin: EBB0:PB11
    spi_software_miso_pin: EBB0:PB2
    axes_map: x, z, -y

    [temperature_sensor EBB0]
    sensor_type: temperature_mcu
    sensor_mcu: EBB0

    [extruder]
    step_pin: EBB0:PD0
    dir_pin: EBB0:PD1
    enable_pin: !EBB0:PD2
    heater_pin: EBB0:PB13
    sensor_pin: EBB0:PA3
    microsteps: 16
    nozzle_diameter: 0.4
    filament_diameter: 1.75
    pressure_advance: 0.04
    pressure_advance_smooth_time: 0.04
    min_extrude_temp: 180
    min_temp: 10
    sensor_type: ATC Semitec 104NT-4-R025H42G
    max_temp: 290

    [tmc2209 extruder]
    uart_pin: EBB0:PA15
    sense_resistor: 0.11
    interpolate: False
    stealthchop_threshold: 0

    [heater_fan T0_hotend_fan]
    pin: EBB0:PA0
    kick_start_time: 0.5
    heater_temp: 50.0
    heater: extruder

    [fan_generic T0_part_fan]
    pin: EBB0:PA1
    kick_start_time: 0.5

    [tool T0]
    tool_number: 0
    extruder: extruder
    fan: T0_part_fan
    gcode_x_offset: 0
    gcode_y_offset: 0
    gcode_z_offset: 0
    params_park_x: 0
    params_park_y: 0
    params_park_z: 0
    # params_input_shaper_type_x: mzv
    # params_input_shaper_freq_x: 0
    # params_input_shaper_type_y: mzv
    # params_input_shaper_freq_y: 0

    [tool_probe T0]
    pin: ^EBB0:PB6
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

    [gcode_macro T0]
    variable_active: 0
    gcode: SELECT_TOOL T=0
    ```

=== "T1.cfg" 
    ``` { .cfg .copy hl_lines="15 31 41 48 49 64" }
    [mcu EBB1]
    canbus_uuid: xxxxxxxxxxxx

    [adxl345 EBB1_adxl]
    cs_pin: EBB1:PB12
    spi_software_sclk_pin: EBB1:PB10
    spi_software_mosi_pin: EBB1:PB11
    spi_software_miso_pin: EBB1:PB2
    axes_map: x, z, -y

    [temperature_sensor EBB1]
    sensor_type: temperature_mcu
    sensor_mcu: EBB1

    [extruder1]
    step_pin: EBB1:PD0
    dir_pin: EBB1:PD1
    enable_pin: !EBB1:PD2
    heater_pin: EBB1:PB13
    sensor_pin: EBB1:PA3
    microsteps: 16
    nozzle_diameter: 0.4
    filament_diameter: 1.75
    pressure_advance: 0.04
    pressure_advance_smooth_time: 0.04
    min_extrude_temp: 180
    min_temp: 10
    sensor_type: ATC Semitec 104NT-4-R025H42G
    max_temp: 290

    [tmc2209 extruder1]
    uart_pin: EBB1:PA15
    sense_resistor: 0.11
    interpolate: False
    stealthchop_threshold: 0

    [heater_fan T1_hotend_fan]
    pin: EBB1:PA0
    kick_start_time: 0.5
    heater_temp: 50.0
    heater: extruder1

    [fan_generic T1_part_fan]
    pin: EBB1:PA1
    kick_start_time: 0.5

    [tool T1]
    tool_number: 1
    extruder: extruder1
    fan: T1_part_fan
    gcode_x_offset: 0
    gcode_y_offset: 0
    gcode_z_offset: 0
    params_park_x: 0
    params_park_y: 0
    params_park_z: 0
    # params_input_shaper_type_x: mzv
    # params_input_shaper_freq_x: 0
    # params_input_shaper_type_y: mzv
    # params_input_shaper_freq_y: 0

    [tool_probe T1]
    pin: ^EBB1:PB6
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

    [gcode_macro T1]
    variable_active: 0
    gcode: SELECT_TOOL T=1
    ```

