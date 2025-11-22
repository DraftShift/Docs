# G-code Offset Calibration

## Important Notes
- **Tn refers to the tool on the shuttle** (e.g., T1 = Tool 1).  
- **Only home or probe using T0.**  
- **`gcode_z_offset`, `gcode_x_offset`, `gcode_y_offset` for Tool 0 must always be `0`.** All other tools are offset relative to T0.

!!! warning "Before You Start"
    - All gcode calibration are relative to T0, so it is important that the printer has perfect first layer adhesion with T0 before calibrating the gcode offsets.
    - It is recomended that you run a test print with T0 before calibrating the gcode offsets.
    

---

## Manual Calibration

Manual calibration uses a paper test to measure Z-offsets between tools.

!!! note "Prerequisites"
    - All tools must have their `z_offset` calibrated first (see [Probe Offset](probe_offset.md))
    - Only home or probe with T0 during this calibration

### GCODE Z Offset Procedure

1. Ensure **T0 is on the shuttle**
2. Run:
    ```gcode
    INITIALIZE_TOOLCHANGER
    ```
3. Home the machine:
    ```gcode
    G28
    ```
4. Level the gantry:
    ```gcode
    QUAD_GANTRY_LEVEL
    ```
5. Home Z again:
    ```gcode
    G28
    ```
6. Raise the nozzle:
    ```gcode
    G1 Z10 F600
    ```
7. **Manually remove the current tool** and place the next tool on the shuttle
8. Perform a [manual paper test](#manual-paper-test) and adjust Z until you feel slight resistance
9. Once satisfied, run `M114` and **copy the Z value**
10. Set this value as `gcode_z_offset` in `[tool Tn]` of the toolhead config file
11. Repeat from **step 6** for all remaining tools
12. Run:
    ```gcode
    FIRMWARE_RESTART
    ```

### Manual Paper Test

The "paper test" involves placing a regular piece of paper between the bed and nozzle, then commanding the nozzle to different Z heights until you feel slight friction when moving the paper.

**Key Points:**
- Use regular copy paper (approximately 100 microns / 0.1mm thick)
- Always perform the test at **room temperature** (both nozzle and bed cold)
- Ensure the nozzle and bed are clean and free of debris
- Use the same surface/tape that you normally print on

**Procedure:**
1. Cut a small piece of paper (approximately 5x3 cm)
2. Place it between the nozzle and bed
3. Using your web interface (Mainsail/Fluidd), jog the nozzle down in small increments
4. Push the paper back and forth to feel for resistance
5. Continue until you feel slight friction (paper can slide but with resistance)
6. Note the Z position using `M114`

---

## Automatic Calibration

Automatic calibration uses specialized tools to measure X/Y/Z offsets more precisely and efficiently.

### Available Methods

- **[Manual Calibration Tool](https://www.printables.com/model/201707-x-y-and-z-calibration-tool-for-idex-dual-extruder){:target="_blank"}** – Print a calibration jig to measure physical distances between nozzles
- **[SexBall Probe](/hardware/calibration_tools/#sexball-probe)** – Mechanical probe using precision spheres for repeatable measurements
- **[Axiscope](https://github.com/nic335/Axiscope){:target="_blank"}** – Camera-based visual alignment to printed targets
- **[NozzleAlign](https://github.com/viesturz/NozzleAlign){:target="_blank"}** – Camera-based alignment system
- **[kTAMV](https://github.com/TypQxQ/kTAMV){:target="_blank"}** – Klipper Tool Alignment Machine Vision
- **[Nudge](https://github.com/zruncho3d/nudge){:target="_blank"}** – Software-guided iterative calibration using printed patterns

Refer to each tool's documentation for specific calibration procedures.

