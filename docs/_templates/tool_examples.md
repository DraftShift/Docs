{%- macro pin(mcu, pin, flip=False) -%}
{%- set pullup = "^" if "^" in pin else "" -%}
{%- set invert = "!" if "!" in pin else "" -%}

{%- if flip -%}
    {%- set invert = ("" if "!" in pin else "!") -%}
{%- else -%}
    {%- set invert = ("!" if "!" in pin else "") -%}
{%- endif -%}

{%- set cleaned_pin = pin|replace("^","")|replace("!","") -%}
{%- set mcu_pin = pullup ~ invert ~ mcu ~ ":" ~ cleaned_pin -%}

{{- mcu_pin -}}
{%- endmacro %}

=== "Tool Configs"
{% for tb, data in example_boards.items() %}
    === "{{ tb }}"
        {% for version in ["TAP", "Non-TAP"] %}
        {% for i in range(2) %}
        {% set mcu = data.mcu_name + i|string %}
        === "{{ tb }} T{{ i }} ({{ version }})"
            ``` cfg { title="Example {{ tb }} T{{ i }} Config (TAP)" .copy }
            {{ data.preface|indent(12) }}
            # change the mcu section name to the tool board you are configuring:
            # {{ data.mcu_name }}0, {{ data.mcu_name }}1, etc.
            [mcu {{mcu}}]
            {%- if data.protocol == "CAN" %}
            canbus_uuid: xxxxxxxxxxxx
            {% else %}
            serial: /dev/serial/by-id/usb-Klipper_xxxxxx_xxxxxxxxxxxxx
            restart_method: command
            {% endif %}
            # change the accelerometer section name to the tool you are configuring:
            # T0, T1, etc.
            [{{ data.accelerometer }} T{{ i }}]
            cs_pin: {{ pin(mcu, data.pin_map.acc_cs_pin) }}
            spi_software_sclk_pin: {{ pin(mcu, data.pin_map.acc_sclk_pin) }}
            spi_software_mosi_pin: {{ pin(mcu, data.pin_map.acc_mosi_pin) }}
            spi_software_miso_pin: {{ pin(mcu, data.pin_map.acc_miso_pin) }}
            axes_map: {{ data.axis_map }}

            # change to the extruder section you are configuring:
            # extruder, extruder1, etc.
            [extruder{{ i if i > 0 else "" }}] # Orbiter2.5 with CHCB-V Hotend
            step_pin: {{ pin(mcu, data.pin_map.step_pin) }}
            dir_pin: {{ pin(mcu, data.pin_map.dir_pin) }}
            enable_pin: {{ pin(mcu, data.pin_map.enable_pin) }}
            heater_pin: {{ pin(mcu, data.pin_map.heater_pin) }}
            sensor_pin: {{ pin(mcu, data.pin_map.sensor_pin) }}
            {%- if data.pullup_resistor|length %}
            pullup_resistor: {{ data.pullup_resistor -}}
            {% endif %}
            microsteps: 16
            rotation_distance: 4.69
            full_steps_per_rotation: 200
            nozzle_diameter: 0.400
            filament_diameter: 1.750
            min_temp: 0
            max_temp: 290
            pressure_advance: 0.03
            sensor_type: ATC Semitec 104NT-4-R025H42G
            # max_extrude_only_distance: 101
            control: pid
            pid_Kp: 18.000 # Reduce gain to make response gentler
            pid_Ki: 2.400  # Reduce accumulated correction
            pid_Kd: 20     # Increase damping to resist sharp swings

            # change the tmc2209 section name to match the extruder you are configuring:
            # extruder, extruder1, etc.
            [tmc2209 extruder{{ i if i > 0 else "" }}] # Orbiter2.5
            uart_pin: {{ pin(mcu, data.pin_map.uart_pin) }}
            {%- if data.pin_map.tx_pin|length %}
            tx_pin: {{ pin(mcu, data.pin_map.tx_pin) -}}
            {% endif %}
            {%- if data.sense_resistor|length %}
            sense_resistor: {{ data.sense_resistor -}}
            {% endif %}
            run_current: 0.85
            stealthchop_threshold: 0

            # change the heater_fan section name to match the tool you are configuring:
            # T0_hotend_fan, T1_hotend_fan, etc.
            [heater_fan T{{ i }}_hotend_fan]
            pin: {{ pin(mcu, data.pin_map.hotend_fan_pin) }}
            heater: extruder{{ i if i > 0 else "" }} # change to match the extruder you are configuring: extruder, extruder1, etc.
            heater_temp: 50.0
            {%- if data.pin_map.he_tach_pin|length %}
            # tachometer_pin: {{ pin(mcu, data.pin_map.he_tach_pin) }}
            # tachometer_ppr: 2
            {%- endif %}

            # change the fan_generic section name to the tool you are configuring:
            # T0_partfan, T1_partfan, etc.
            [fan_generic T{{ i }}_part_fan]
            pin: {{ pin(mcu, data.pin_map.part_fan_pin) }}
            {%- if data.pin_map.part_tach_pin|length %}
            # tachometer_pin: {{ pin(mcu, data.pin_map.part_tach_pin) }}
            # tachometer_ppr: 2
            {%- endif %}

            # change the tool section name to the tool you are configuring:
            # T0, T1, etc.
            [tool T{{ i }}]
            tool_number: {{ i }} # change to the index of the tool. 0, 1, 2, etc.
            extruder: extruder{{ i if i > 0 else "" }} # change to match the extruder you are configuring: extruder, extruder1, etc.
            fan: T{{ i }}_part_fan
            {% if version != "TAP" %}
            {{- "detection_pin: " ~ pin(mcu, data.pin_map.detection_pin, flip=True) }}
            {% endif -%}
            params_park_x: 0 # Absolute X position of where the tool sits in it's dock.
            params_park_y: 0 # Absolute Y position of where the tool sits in it's dock.
            params_park_z: 0 # Absolute Z position of where the tool sits in it's dock.

            # Results from input shaper
            params_input_shaper_type_x: 'mzv'
            params_input_shaper_freq_x: 52
            params_input_shaper_type_y: 'mzv'
            params_input_shaper_freq_y: 37.2
            {% if version == "TAP" %}
            # change the tool_probe section name to the tool you are configuring:
            # T0, T1, etc.
            [tool_probe T{{ i }}]
            pin: {{ pin(mcu, data.pin_map.detection_pin) }}
            tool: {{ i }} # change to the index of the tool. 0, 1, 2, etc.
            z_offset = 0 # Needs to be calibrated. More positive = More Squish
            speed: 5.0
            samples: 3
            samples_result: median
            sample_retract_dist: 2.0
            samples_tolerance: 0.02
            samples_tolerance_retries: 3
            activate_gcode:
            _TAP_PROBE_ACTIVATE HEATER=extruder{{ i if i > 0 else "" }} # change to match the extruder you are configuring: extruder, extruder1, etc.
            {% endif %}
            {% if data.pin_map.rgb_pin|length -%}
            # change the neopixel section name to the tool you are configuring:
            # T0, T1, etc.
            [neopixel T{{ i }}]
            pin: {{ pin(mcu, data.pin_map.rgb_pin) }}
            color_order: GRBW
            chain_count: 23
            initial_RED: 0.5
            initial_GREEN: 0.0
            initial_BLUE: 0.5
            initial_WHITE: 0.0
            {% endif %}
            # change the gcode_macro section name to the tool you are configuring:
            # T0, T1, etc.
            [gcode_macro T{{ i }}]
            variable_active: 0 # Must be zero.
            variable_color: "" # Leave empty
            gcode:
                SELECT_TOOL T={{ i }} # change to the index of the tool. 0, 1, 2, etc.
            ```
        {% endfor %}
        {% endfor %}
{% endfor %}
