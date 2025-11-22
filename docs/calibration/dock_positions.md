# Dock Locations & Setup Guide

!!! warning "Important"
    It is important that T0 has a calibrated `z_offset` before calibrating the docks.

!!! warning "Important"
    Don't forget to set you tool path in the config.

## Parameter Definitions

- **params_park_x**  
  The absolute X-position of the tool in its dock.

- **params_park_y**  
  The absolute Y-position of the tool in its dock.

- **params_park_z**  
  The absolute Z-position where the tool and shuttle mate, determined when the TAP (or Z-probe) triggers.

## How to Find Dock Locations

Follow this guide to accurately locate each toolhead dock and set the correct parameters in your toolhead configuration.

!!! warning "Start slow."
    Increase speed only after confirming clearances.
    Crashing into the dock can cause serious damage.

### 1. Prepare the Printer
1. With T0 mounted on the shuttle, 
2. `G28` home the machine.
3. Perform **QGL** (Quad Gantry Leveling).
4. `G28 Z` home Z again.

### 2. Adjusting the tool resting position in the dock
1. Using your GUI (Mainsail or Fluidd), carefully move **Tool 0 (T0)** into its dock.  
2. Align the **feet of the backplate** with the **rear of the dock**.
3. Lower until the tool start lifting off the shuttle.
4. Adjust the dock’s back plate up until it touch the feet of the tool backplate.
!!! info "Adjustable Dock"
    - The back of each dock is adjustable—this ensures the tool sits flat and pins align properly when the shuttle picks it up.
    - If your toolhead leans or does not mate cleanly, adjust the dock’s rear stop.

### 3. Find the actual pickup position
1. redo step 1, Homing/QGL.
2. Manually place by hand the tool being calibrated in the dock.
3. Manually jog to the tool.
4. Slowly jog upward to mount the tool, until TAP sensor triggers.
5. Record the X/Y/Z positions where the TAP sensor triggers on a paper.
6. Redo steps 2-5 for each tool.

### 4. Update the Toolhead Config
- Insert your recorded values into the tool’s config under `params_park_x`, `params_park_y`, and `params_park_z`.

!!! info "Adding 1mm to Z"
    The `params_park_z` value is the height where the backplate and shuttle fully mate and the TAP sensor triggers.
    Adding 1mm to this value is typically added to ensure the tool is picked up correctly.

### 5. Confirm a Clean Pickup
- Repeat the motion until you can manually pick up the tool reliably, without wobble or misalignment.
