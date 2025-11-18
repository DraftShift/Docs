=== "Macros"
    === "PRINT_START"
        ``` jinja { title="Example PRINT_START Macro" .copy }
        {% raw %}
        {% set TOOL = params.TOOL | default(-1)| int %}
        {% set TOOL_TEMP = params.TOOL_TEMP | default(0) | int %}
        {% set BED_TEMP = params.BED_TEMP | default(0) | int %}

        STOP_CRASH_DETECTION

        M117 Heating Bed
        M190 S{BED_TEMP}

        M117 Homing
        G28
        # Make sure we have T0 active for pre print calibrations.
        T0

        M117 Quad Gantry Level
        QUAD_GANTRY_LEVEL
        G28 Z

        # Switch to the initial printing tool and preheat it.
        {% if TOOL >= 0 %}
            M104 T0 S0 ; shutdown T0.  If it's up first it will be heated below.
            T{params.TOOL}
            {% set initialToolTemp = 'T' ~ params.TOOL|string ~ '_TEMP' %}
            M117 Waiting on T{params.TOOL} S{params[initialToolTemp]}C
            M109 S{params[initialToolTemp]}
        {% else %}
            M109 S{TOOL_TEMP}
        {% endif %}
        {% endraw %}

        START_CRASH_DETECTION
        ```

    === "PRINT_END"
        ``` jinja { title="Example PRINT_END Macro" .copy }
        {% raw %}
        NIC TAKES TOO LONG AND DOESN'T KNOW HOW TO SPELL!
        {% endraw %}
        ```