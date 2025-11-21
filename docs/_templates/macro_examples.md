=== "Macros"
    === "PRINT_START"
        ``` jinja { title="Example PRINT_START Macro" .copy }
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

          ; Switch to the initial printing tool and preheat it.
          {% if TOOL > 0 %}
            M104 T0 S0 ; Shutdown T0.
              T{params.TOOL} ; Switch to the initial printing tool
          {% endif %}

          M117 Waiting on T{params.TOOL} S{TOOL_TEMP}C
          M109 S{TOOL_TEMP} ; Wait for the tool to reach the target temperature

          {% if printer.tool_probe_endstop is defined %}
            M117 Re-enabling crash detection
            START_CRASH_DETECTION
          {% endif %}
        {% endraw %}
        ```

    === "PRINT_END"
        ``` jinja { title="Example PRINT_END Macro" .copy }
        {% raw %}
        [gcode_macro PRINT_END]
        gcode:
          {% set th = printer.toolhead %}
          {% set x_safe = th.position.x + 20 * (1 if th.axis_maximum.x - th.position.x > 20 else -1) %}
          {% set y_safe = th.position.y + 20 * (1 if th.axis_maximum.y - th.position.y > 20 else -1) %}
          {% set z_safe = [th.position.z + 2, th.axis_maximum.z]|min %}

          M220 S100 ; Set Feed rate to 100%
          M221 S100 ; Set Flow rate to 100%

          SET_PRESSURE_ADVANCE ADVANCE=0 ; Disable pressure advance

          G92 E0 ; zero the extruder
          G1 E-2.0 F3600 ; retract filament
          M400 ; wait for buffer to clear

          T0 ; Switch to tool 0

          G90 ; absolute positioning
          G0 X{x_safe} Y{y_safe} Z{z_safe} F20000 ; move nozzle to remove stringing
          G0 X{th.axis_maximum.x//2} Y{th.axis_maximum.y - 2} F3600 ; park nozzle at rear

          SET_GCODE_OFFSET X=0.0 Y=0.0 Z=0.0 ; reset gcode offset

          {% for tn in printer.toolchanger.tool_numbers %}
              M104 S0 T{tn} ; shutdown tool heater
              M107 T{tn} ; shutdown tool fan
              SET_STEPPER_ENABLE STEPPER=extruder{tn if tn > 0 else ''} ENABLE=0 ; disable extruder stepper
          {% endfor %}

          M140 S0 ; shutdown bed heater
        {% endraw %}
        ```