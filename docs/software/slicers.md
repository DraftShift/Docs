# Slicer Configuration

This guide covers how to configure various slicer software to work with StealthChanger multi-tool systems.

## Supported Slicers

| Slicer | Multi-tool Support | Notes |
|:-------|:------------------:|:------|
| **Cura** | :material-check:{ .success } | As of version 5.8, select new printer → DraftShift Design → choose Voron size. Supports up to 8 extruders |
| **OrcaSlicer** | :material-check:{ .success } | Supported as of version 2.2 |
| **PrusaSlicer** | :material-check:{ .success } | Full multi-tool support |
| **SuperSlicer** | :material-check:{ .success } | See [Issue #2197](https://github.com/supermerill/SuperSlicer/issues/2197) for details |
| **Simplify3D** | :material-help:{ .warning } | Status unknown |
| **Slic3r** | :material-help:{ .warning } | Status unknown |

---

## Slicer Configuration

=== "PrusaSlicer"

    ### Start G-code
    
    Navigate to: **Printer Settings** → **Custom G-code** → **Start G-code**
    
    !!! warning "Single Line Requirement"
        The entire start G-code must be on a single line.
    
    ```gcode
    PRINT_START TOOL_TEMP={first_layer_temperature[initial_tool]} {if is_extruder_used[0]}T0_TEMP={first_layer_temperature[0]}{endif} {if is_extruder_used[1]}T1_TEMP={first_layer_temperature[1]}{endif} {if is_extruder_used[2]}T2_TEMP={first_layer_temperature[2]}{endif} {if is_extruder_used[3]}T3_TEMP={first_layer_temperature[3]}{endif} {if is_extruder_used[4]}T4_TEMP={first_layer_temperature[4]}{endif} {if is_extruder_used[5]}T5_TEMP={first_layer_temperature[5]}{endif} BED_TEMP=[first_layer_bed_temperature] TOOL=[initial_tool]
    ```
    
    ### Tool Change G-code
    
    Navigate to: **Printer Settings** → **Custom G-code** → **Tool change G-code**
    
    ```gcode
    M104 S{temperature[next_extruder]} T[next_extruder] ; set new tool temperature so it can start heating while changing
    ```
    
    !!! tip "Prime Tower Support"
        If you're using a prime tower, add this as a second line:
        ```gcode
        G1 X{wipe_tower_x} Y{wipe_tower_y} F{travel_speed*60} ; Move to wipe tower before tool change
        ```

=== "OrcaSlicer"

    ### Machine Start G-code
    
    Navigate to: **Printer Settings** → **Machine G-code** → **Machine start G-code**
    
    !!! warning "Single Line Requirement"
        The entire start G-code must be on a single line.
    
    ```gcode
    PRINT_START TOOL_TEMP={first_layer_temperature[initial_tool]} {if is_extruder_used[0]}T0_TEMP={first_layer_temperature[0]}{endif} {if is_extruder_used[1]}T1_TEMP={first_layer_temperature[1]}{endif} {if is_extruder_used[2]}T2_TEMP={first_layer_temperature[2]}{endif} {if is_extruder_used[3]}T3_TEMP={first_layer_temperature[3]}{endif} {if is_extruder_used[4]}T4_TEMP={first_layer_temperature[4]}{endif} {if is_extruder_used[5]}T5_TEMP={first_layer_temperature[5]}{endif} BED_TEMP=[first_layer_bed_temperature] TOOL=[initial_tool]
    ```
    
    ### Change Filament G-code
    
    Navigate to: **Printer Settings** → **Machine G-code** → **Change Filament G-code**
    
    ```gcode
    ;Leave blank
    ```
    
    !!! info
        Leave this field empty to allow the StealthChanger system to handle filament changes.

=== "Cura"

    ### Start G-code
    
    Navigate to: **Machine Settings** → **Printer** → **Start G-code**
    
    !!! warning "Single Line Requirement"
        The entire start G-code must be on a single line.
    
    ```gcode
    PRINT_START TOOL_TEMP={material_print_temperature_layer_0} T{initial_extruder_nr}_TEMP={material_print_temperature_layer_0} BED_TEMP={material_bed_temperature_layer_0} TOOL={initial_extruder_nr}
    ```
    
    ### Extruder Start G-code
    
    Navigate to: **Machine Settings** → **Printer** → **Tool n** → **Extruder Start G-code**
    
    ```gcode
    ;Leave blank
    ```
    
    ### Pre Tool Change G-code
    
    Navigate to: **Machine Settings** → **Printer** → **Tool n** → **Pre tool change G-code**
    
    !!! note "Cura 5.10+"
        This feature requires Cura version 5.10 or later.
    
    ```gcode
    M104 S{material_print_temperature} T{extruder_nr}
    ```

---

## Understanding the G-code

### PRINT_START Parameters

The `PRINT_START` macro accepts the following parameters:

- **TOOL_TEMP**: Temperature for the initially selected tool
- **T0_TEMP, T1_TEMP, etc.**: Individual temperatures for each tool (only passed if tool is used)
- **BED_TEMP**: Bed temperature for the first layer
- **TOOL**: Initial tool number to start with

### Temperature Management

The tool change G-code (`M104 S{temperature[next_extruder]} T[next_extruder]`) ensures that the next tool starts heating before the tool change completes, reducing wait times during multi-tool prints.

---

## Tips for Multi-tool Printing

!!! tip "Tool Temperature Optimization"
    - Set different temperatures for different materials/tools
    - The system will only heat tools that are actually used in the print
    - Tools start heating before the change to minimize downtime

!!! tip "Prime Tower Usage"
    - Use a prime tower to ensure clean tool changes
    - Position it strategically to minimize travel time
    - Adjust tower size based on material compatibility

!!! warning "First Layer Considerations"
    - Ensure all tools are properly calibrated with Z-offsets
    - Test single-tool prints before attempting multi-tool prints
    - Verify tool offsets are accurate
