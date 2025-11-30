# Dock Positions
{% macro code_block() %}
``` cfg title="[tool Tn] example." hl_lines="5 6 7"
  [tool T0]
  tool_number: 0 # change to the index of the tool. 0, 1, 2, etc.
  extruder: extruder # change to match the extruder you are configuring: extruder, extruder1, etc.
  fan: T0_part_fan
  params_park_x: 5.0   # The absolute X-position of the tool in its dock.
  params_park_y: 10.8  # The absolute Y-position of the tool in its dock.
  params_park_z: 264.4 # The absolute Z-position where the tool and shuttle mate in the dock, determined when the TAP (or Z-probe) triggers.
```
{% endmacro %}

## Parameter Definitions

{{ code_block() }}

- **params_park_x**  
  The absolute X-position of the tool in its dock.

- **params_park_y**  
  The absolute Y-position of the tool in its dock.

- **params_park_z**  
  The absolute Z-position where the tool and shuttle mate in the dock, determined when the TAP (or Z-probe) triggers.

## How to Find Dock Positions

Follow this guide to accurately locate each tool's dock and set the correct parameters in your [tool configuration](../software/ktc-easy/configuration/tool.md).

!!! warning "Start Slow"
    - Increase speed only after confirming clearances.
    - Crashing into the dock can cause serious damage.

### 1. Prepare the Printer
1. With T0 mounted on the shuttle, 
2. Run `G28` to home the printer.
3. Run `QUAD_GANTRY_LEVEL`.
4. Run `G28 Z` to home the Z axis again.

### 2. Adjusting the tool's resting position in the dock
1. Ensure the dock's back plate is loosened and lowered to its lowest position.
2. Using manual controls (Mainsail, Fluidd, KlipperScreen), carefully move tool 0 into its dock.
3. Align the feet of the tool's Backplate with the rear of the dock.
4. Lower the gantry until the tool's pins start lifting out of the shuttle's bushings.
5. Adjust the dock’s back plate up until it touch the feet of the tool's backplate.

!!! info "Adjustable Dock"
    - Each dock has an adjustable rear section that ensures the tool sits level and that the alignment pins engage correctly when the shuttle receives it.
    - If your toolhead leans or does not mate cleanly, adjust the dock’s back plate.

### 3. Find the actual pickup position
1. Redo step 1, Home/QGL/Home Z again.
2. Manually position the tool being calibrated into the dock by hand.
3. Manually jog the shuttle underneath the tool.
4. Jog upward in small increments, meshing the tool on the shuttle until the OptoTap sensor triggers.
5. Record the X/Y/Z positions where the OptoTap sensor triggers.
6. Redo steps 2-5 for each tool.

### 4. Update the Toolhead Config
- Insert your recorded values into the `params_park_x`, `params_park_y`, and `params_park_z` variables of each [tool’s config](../software/ktc-easy/configuration/tool.md).

!!! tip "Adding 1mm to Z"
    The `params_park_z` value is the height where the backplate and shuttle fully mate and the TAP sensor triggers.

    Increasing the recorded value by 1mm will help ensure the OptoTap sensor gets triggered and the tool is picked up correctly.

{{ code_block() }}

### 5. Confirm a Clean Pickup
1. Redo step 1, Home/QGL/Home Z again.
2. For safety, set the speed to 50% buy running `M220 S50`
3. With your finger over the emergency stop, run `T1`. This will initiate a tool change to tool 1 at half speed. Watch as tool 0 on the gantry gets dropped off and the tool 1 gets picked up. **Press the emergency stop if anything goes wrong**.
4. Repeat step 3 for all of the tools by running `Tn`. This will drop of the tool that is currently on the shuttle and pick up the tool specified.

!!! tip "Wobble or Misalignment"
    If there is any wobble or misalignment, there cant be any guarantee that the tool will be in the correct position the next time it is requested to be picked up.

    - Fix any misalignment by going through steps 3 and 4 again until you find the exact spot where the tools rest correctly.
    - Repeat this process until your confident the printer will pick up and drop off each tool cleanly.
