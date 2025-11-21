# GCODE Z-Offset Calibration Procedure (Multi-Tool / Toolchanger)

## Important Notes
- **Tn refers to the tool on the shuttle** (e.g., T1 = Tool 1).  
- **Only home or probe using T0.**  
- **`gcode_z_offset` for Tool 0 must always be `0`.** All other tools are offset relative to T0.

---

## 1. Set Z-offsets for all tools
You will measure each tool relative to the bed using a manual paper test.

---

## 2. Prepare the Machine

1. Ensure **T0 is on the shuttle**.  
2. Run:
    ```gcode
    INITIALIZE_TOOLCHANGER
    ```
    - This ensures the toolchanger system is in a known state.  
3. Home the machine using T0:
    ```gcode
    G28
    ```
    - Always use T0 for homing.  
    - After this, the machine knows the absolute positions.  
4. Ensure the bed is clean and free of debris.

---

## 3. Set Z-offset for T0 (reference tool)

1. Load T0 (if not already loaded).  
2. Move the nozzle above the bed (use the center for consistency):
    ```gcode
    G1 X100 Y100 Z10 F6000
    ```
3. Use a sheet of paper to set the Z-offset manually:
    - Lower the nozzle in small increments until the paper can just slide under the nozzle with slight resistance.  
    - Record this position as `Z=0` for T0.  
4. Set the Z-offset for T0 to 0 in Toolprobe section of T0 toolhead config:
 
---

## 4. Measure Gcode_offset for all other tools (T1, T2, …)

> **Important:** All measurements are relative to T0.

1. Load the next tool, e.g., T1:
    ```gcode
    T1
    ```
2. Move to the same X/Y position used for T0:
    ```gcode
    G1 X100 Y100 Z10 F6000
    ```
3. Lower the nozzle until the paper test gives slight resistance.  
4. Record the Z position displayed by the machine (let’s call it `Z_measure`).  
5. Compute the tool offset relative to T0:
    ```
    gcode_z_offset_T1 = Z_measure - Z_T0
    ```
6. Set this offset in The toolhead config:
 
7. Repeat steps 1–6 for all remaining tools.

---

## 5. Verify Offsets

1. Home the machine with T0:
    ```gcode
    G28
    ```
2. Load each tool in turn and move to the same test point:
    ```gcode
    Tn
    G1 X100 Y100 Z5 F6000
    ```
3. Check that the nozzle lightly touches paper at the same Z height. Adjust offsets if necessary.

---

## 6. Final Notes
- Always **home with T0**.  
- Do not change `gcode_z_offset` for T0.  
- Keep a record of all tool offsets for future reference.
