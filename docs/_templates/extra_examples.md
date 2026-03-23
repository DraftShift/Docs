=== "Extras"
    === "TOOLCHANGE_DEMO"
        ``` jinja { title="A macro to showcase multiple toolchanges" .copy }
        {% raw %}
        [gcode_macro TOOLCHANGE_DEMO]
        description: [SAMPLES=<int>]
          Run random tool changes.
          SAMPLES= Number of changes to run, default is 20.
        gcode:
            {% set t = params.SAMPLES|default(20)|int %}
            {% for n in range(t) %}
              T{ printer.toolchanger.tool_numbers | random }
            {% endfor %}
        {% endraw %}
        ```

    === "PRIME_LINES"
        ``` jinja { title="A prime line macro to prime each tool before a print." .copy }
        {% raw %}
        [gcode_macro PRIME_LINES]
        description: 
          Prime all activly heating tools before printing. 
          Requires all tools that are used in the print to be heated before running.
          INITIAL_TOOL= Tool number, optional.
        variable_tools_per_x:          6      # Number of tools primed in a single row
        variable_lines_per_tool:       6      # Number of prime lines per tool
        variable_line_step_y:          2      # Distance between lines in Y axis
        variable_spacing:              7      # Distance between each tools prime lines
        variable_ratio:                4      # Distance to move per 1mm of extrusion
        variable_x_neg_offset:         5      # Distance from Edge of the bed on the -X axis
        variable_x_pos_offset:         5      # Distance from Edge of the bed on the +X axis
        variable_y_offset:             8      # Distance from Edge of the bed on the -Y axis
        variable_pre_prime:            8      # Amount of extrude to do before starting prime line
        variable_wipe_length:          6      # Wipe length after prime
        variable_initial_tool_retract: 0.2    # Retraction distance for the initial tool (if defined) after prime
        variable_docked_tool_retract:  0.5    # Retraction distance for docked tools after prime
        variable_z_prime_pos:          0.3    # Distance from bed on Z axis while priming
        variable_z_move_pos:           1      # Distance from bed on Z axis while moving
        variable_move_speed:           10000  # Travel move speed
        variable_prime_speed:          1000   # Prime move speed
        variable_wipe_speed:           3000   # Wipe move speed
        variable_temp_drop:            30     # Amount of temperature drop applied to nozzles that are being docked

        gcode:
          {% set max_x = printer.configfile.config["stepper_x"]["position_max"]|float %}
          {% set max_y = printer.configfile.config["stepper_y"]["position_max"]|float %}
          {% set line_length = (max_x-(x_neg_offset+x_pos_offset)-(spacing*(tools_per_x-1)))/tools_per_x %}
          {% set print_tools = [] %}

          # Figure out the required tools by which tools are preheating
          {% for tn in printer.toolchanger.tool_numbers %}
            {% set extruder_id = "extruder" + tn|string if tn > 0 else "extruder" %}

            {% if printer[extruder_id].target >= printer.configfile.settings[extruder_id].min_extrude_temp %}
              {% set gengar = print_tools.append(tn) %}
            {% endif %}
          {% endfor %}

          # Make sure the initial print tool is the last to prime
          {% if params.INITIAL_TOOL is defined %}
            {% set initial_tool = params.INITIAL_TOOL|int %}

            {% if print_tools|length > 1 %}
              {% set snorlax   = print_tools.pop(print_tools.index(initial_tool)) %}
              {% set lickitung = print_tools.append(initial_tool) %}
            {% endif %}
          
            {% if printer.toolchanger.tool_number != initial_tool and printer.toolchanger.tool_number != print_tools[0] and printer.toolchanger.tool_number in print_tools %}
              {% set mimikyu = print_tools.pop(print_tools.index(printer.toolchanger.tool_number)) %}
              {% set bulbasaur = print_tools.insert(0, printer.toolchanger.tool_number) %}
            {% endif %}

            {% else %}
              {% set initial_tool = None %}
          {% endif %}
          
          {% for tn in print_tools %}
            # Change tool
            T{tn}

            {% set extruder_id = "extruder" + tn|string if tn > 0 else "extruder" %}
            {% set t_idx = print_tools.index(tn) %}
            {% set y_idx = (t_idx/tools_per_x)|int %}
            {% set x_tool_list = print_tools[y_idx*tools_per_x:] %}
            {% set x_idx = x_tool_list.index(tn) %}
            {% set prime_start_x = x_neg_offset + (x_idx*line_length) + (x_idx*spacing) %}
            {% set prime_start_y = y_offset + (line_step_y*(lines_per_tool-1)) + (y_idx*spacing) %}

            # Move to position
            G0 X{prime_start_x} Y{prime_start_y} Z{z_move_pos} F{move_speed}
            G0 Z{z_prime_pos} F{move_speed}

            # Wait for temp
            M109 S{printer[extruder_id].target} T{tn}

            # Prime Tool
            M117 Priming T{tn}
            M83
            G92 E0
            G91
            G1 E{pre_prime} F{prime_speed}
            
            {% for i in range(lines_per_tool) %}
              {% set last_line = i == lines_per_tool-1 %}
              {% set segment = ((line_length/ratio)-2)|int if last_line else ((line_length/ratio)+1)|int %}
              
              {% if i % 2 == 0 %}
                {% for _i in range(1, segment) %}
                  G1 X{ratio} E1 F{prime_speed}
                {% endfor %}
              {% else %}
                {% for _i in range(1, segment) %}
                  G1 X-{ratio} E1 F{prime_speed}
                {% endfor %}
              {% endif %}
          
              {% if not last_line %}
                G1 Y-{line_step_y} E{(line_step_y/ratio)*1} F{move_speed}
              {% endif %}
            {% endfor %}

            G1 E-{initial_tool_retract if tn == initial_tool else docked_tool_retract} F{wipe_speed}
            G0 X{-0.5 if lines_per_tool % 2 == 0 else 0.5} F{wipe_speed}
            G0 X{wipe_length-0.5 if lines_per_tool % 2 == 0 else -(wipe_length-0.5)} F{wipe_speed}
            G0 Z{z_move_pos}

            # Reduce temp for tools that are not required yet
            {% if params.INITIAL_TOOL is defined %}
              {% if initial_tool in print_tools %}
                {% if tn != initial_tool %}
                  M104 S{printer[extruder_id].target-temp_drop} T{tn}
                {% endif %}
              {% endif %}
            {% endif %}

          G90

          {% endfor %}

        {% endraw %}
        ```


    === "PRINT_START with PRIME_LINES"
        ``` jinja { title="PRINT_START macro that includes a call to the PRIME_LINES macro." .copy }
        {% raw %}
        [gcode_macro PRINT_START]
        gcode:
          {% set TOOL = params.TOOL | default(0)| int %}
          {% set TOOL_TEMP = params.TOOL_TEMP | default(0) | int %}
          {% set BED_TEMP = params.BED_TEMP | default(0) | int %}

          {% if printer.tool_probe_endstop is defined %}
            M117 Disabling crash detection
            STOP_CRASH_DETECTION
          {% endif %}

          M117 Heating Bed
          M190 S{BED_TEMP}

          M117 Homing
          G28

          T0 ; Ensure we have T0 active for pre print calibrations.

          M117 Quad Gantry Level
          QUAD_GANTRY_LEVEL

          G28 Z ; Home Z again after QGL

          BED_MESH_CALIBRATE ADAPTIVE=1 ; Run adaptive bed mesh

          {% if printer.tool_probe_endstop is defined %}
            M117 Re-enabling crash detection
            START_CRASH_DETECTION
          {% endif %}

          M117 Preheat all printing tools for priming
          {% for tn in printer.toolchanger.tool_numbers %}
            {% set ptemp = 'T' ~ tn|string ~ '_TEMP' %}
            {% if ptemp in params %}
              M104 T{tn} S{params[ptemp]}
            {% endif %}
          {% endfor %}

          PRIME_LINES INITIAL_TOOL={TOOL}
        {% endraw %}
        ```
