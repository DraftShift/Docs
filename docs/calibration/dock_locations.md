# Dock Locations & Setup Guide

## Parameter Definitions

- **params_safe_y**  
  The absolute Y-distance from machine zero to the back of the tools in the dock.  
  This should include extra clearance for safety.

- **params_close_y**  
  The relative distance from `safe_y` that the gantry moves to during tool changes.

- **params_fast_speed**  
  The movement speed used when the toolhead is *outside* the dock during a tool change (mm/min).

- **params_path_speed**  
  The movement speed used for pickup/drop-off while *inside* the dock area (mm/min).

- **params_park_x**  
  The absolute X-position of the tool in its dock.

- **params_park_y**  
  The absolute Y-position of the tool in its dock.

- **params_park_z**  
  The absolute Z-position where the tool and shuttle mate, determined when the TAP (or Z-probe) triggers.

---

## How to Find Dock Locations

Follow this guide to accurately locate each toolhead dock and set the correct parameters in your toolhead configuration.

⚠️ **Warning:** Start slow. Increase speed only after confirming clearances. Crashing into the dock can cause serious damage.

### 1. Prepare the Printer
1. **Home** the machine.  
2. Perform **QGL** (Quad Gantry Leveling).

### 2. Manually Position Tool T0 in Its Dock
1. Using your GUI (Mainsail or Fluidd), carefully move **Tool 0 (T0)** into its dock.  
2. Align the **feet of the backplate** with the **rear of the dock**.

   - The back of each dock is adjustable—this ensures the tool sits flat and pins align properly when the shuttle picks it up.
   - If your toolhead leans or does not mate cleanly, adjust the dock’s rear stop.

### 3. Find the Proper Alignment
1. Once the tool is positioned correctly, **move down slowly** until the pins clear the shuttle.  
2. Move slightly in **positive Y**, then back toward the tool.  
3. Move upward to **pick up the tool**, ensuring the motion is smooth and the tool seats without shifting.

### 4. Confirm a Clean Pickup
- Repeat the motion until you can manually pick up the tool reliably, without wobble or misalignment.

### 5. Record Coordinates
Record the following:

- **X and Y:**  
  The coordinates where the tool sits correctly in the dock.  
  Use these values for `params_park_x` and `params_park_y`.

- **Z:**  
  The height where the **backplate and shuttle fully mate** and the **TAP sensor triggers**.  
  Use this value for `params_park_z`.

### 6. Update the Toolhead Config
- Insert your recorded values into the tool’s config under `params_park_x`, `params_park_y`, and `params_park_z`.

### 7. Repeat for Each Tool
- Perform the same procedure individually for T1, T2, etc.

---
