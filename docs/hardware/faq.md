# Hardware FAQ

This page contains frequently asked questions organized by component. Use the table of contents below to quickly navigate to the section you need.

## Table of Contents

- [StealthChanger (Shuttle & Backplate)](#stealthchanger-shuttle--backplate)
- [Modular Dock](#modular-dock)
- [Toolheads](#toolheads)
- [Tophat](#tophat)
- [Cable Management](#cable-management)
- [Calibration Tools](#calibration-tools)
- [Software & Configuration](#software--configuration)
- [Calibration](#calibration)
- [Slicers](#slicers)
- [Endstops](#endstops)

---

## StealthChanger (Shuttle & Backplate)

### Do I need an OctoTAP board per toolhead?
Yes. Each toolhead needs an OctoTAP board to detect which tool is actively on the shuttle. The optical sensor's beam is broken by the shuttle's flag, allowing the software to identify the active tool and detect successful tool changes.

---

### My magnets don't fit in my backplate
Measure your magnets with a caliper—cheaply sourced magnets are often not exactly 6x3mm. Check your [print settings](../getting_started.md#print-tuning) to ensure your printer has calibrated filament shrinkage.

---

### My shuttle and backplate don't mate well
With a CNC shuttle, it's critical to calibrate your filament shrinkage. Printed shuttles have more tolerance since both parts shrink similarly, but CNC shuttles require exact alignment. Measure the distance between the outside edges of the pins—it should be exactly 39mm. Even 0.1mm off can cause binding.

See [Print Tuning](../getting_started.md#print-tuning) and [Hardware Troubleshooting](troubleshooting.md#shuttle-and-backplate-resistance) for more help.

---

### My dimensions are spot on but my shuttle doesn't mate smoothly
If your pins are held in by screws, mate the backplate with the shuttle first, then tighten the pin screws while mated. This aligns the pins perfectly with the shuttle bushings. Then bed in the parts by running `PROBE_ACCURACY SAMPLES=100` repeatedly (place something hard under the nozzle to avoid dimpling the PEI plate).

If issues persist, you could try [heat-treating the backplate](troubleshooting.md#shuttle-and-backplate-resistance) to adjust it slightly.

---

### Do I really need N52 magnets?
Yes. N52 magnets are much stronger than N35 and make the shuttle/toolhead connection more rigid. N35 magnets can cause reliability issues and introduce play.

---

### How do I install the magnets?
If you have screw-in magnets, just screw them in place. For standard magnets, use two-component epoxy (not CA glue/super glue) that doesn't set immediately. This allows you to press in the magnet and adjust it flush with the backplate or shuttle. CA glue can lose its bond in enclosed printers due to heat, causing magnets to pop out.

---

## Modular Dock

### Moving from and to the dock is so slow
Increase `max_z_velocity` and `max_z_accel` in small steps. For example, 24V Moons motors with TMC2209 drivers can reliably get `max_z_velocity: 200` and `max_z_accel: 750`, reducing dropoff/pickup to ~10 seconds.

---

### I can't get past 50mm/s Z velocity before it makes really angry noises and skips steps
Disable [StealthChop](https://www.klipper3d.org/TMC_Drivers.html#setting-spreadcycle-vs-stealthchop-mode) on all Z motors. SpreadCycle is louder but provides much more torque. If you have [TMC autotune](https://github.com/andrewmcgr/klipper_tmc_autotune), set Z motors to `performance` profile.

---

### I can't get my tools to sit flat on the dock
Retract the nozzle blocker cup as far as possible, ensure the tool sits flat by adjusting the back of the dock, then slowly raise the cup until it touches the nozzle without putting force on the toolhead. If your dock/toolhead has magnets, ensure they're inserted deeply enough and sit flush.

---

### My tool is going straight into the dock, I had to emergency stop
Make sure `[rounded_path]` is added to your printer.cfg. Without it, the printer will ignore rounded paths and go straight to the pickup position.

---

### I can't get my crossbar between my frame
Loosen the frame bolt at one corner to create more play, slide the crossbar into position, then tighten the frame again.

---

### I don't want to tap and drill holes for my crossbar, do I need to?
For a crossbar between the frame, use 90-degree corner brackets (consider four brackets: two above and two below for greater rigidity). For a crossbar outside the frame, you need to drill holes in the correct location. See the [Door Buffer build guides](guides/door_buffers/index.md) for instructions.

---

### How high should I mount the crossbar?
- Standard height front-plates: 170mm below the top extrusion
- Short height front-plates: 130mm below the top extrusion
- Without vertical front-plates (crabby docks): More freedom, depends on tallest toolhead height + margin

---

### Do I need to disassemble the whole gantry to install MiniBFI?
No. Disconnect the front Z belts and AB belts, replace the idlers, route the belts and tighten everything up. Do one side at a time, supporting the gantry with a stack of books.

---

### I installed MiniBFI but I don't have enough margin to tension the belts correctly
Keep tension in the belts while installing the shuttle using the [belt helper](https://github.com/DraftShift/StealthChanger/tree/main/STLs/Extras/BeltHelper).

---

### Can Y be negative to reach the docks?
Yes. Keep 0,0 as the left, front corner of the bed. To reach parking positions in the docks, the toolhead will travel beyond the bed, so park Y will be negative. If you move the bed and adjust the 0,0 point, update all dock positions with the same delta change.

---

## Toolheads

### Can I mix and match different toolheads and hotends?
Yes, to a degree. The parking position of toolheads must be similar—if one is significantly higher or lower, the gantry will bump into backplate pins when picking up other tools. Add dock spacers to ensure all backplate pins are at similar heights.

---

### What about different hotends with higher/lower flow rates?
Yes. Configure this in your slicer per extruder, or create separate filament profiles per tool (e.g., "PLA - T0", "PLA - T1").

---

### What about different nozzle sizes?
Yes, if your slicer supports it. OrcaSlicer does.

---

### The wires of my toolboard get snagged when doing a tool change
Shorten your wires, tuck them away with zip ties, or use a PCB cover if your toolhead has one.

---

## Tophat

### Do I need a top hat?
If you're printing with filament that requires chamber temperatures above room temperature, yes. Otherwise, no. 

---

### Can I move the umbilical exits to the tophat back panel?
Generally not. The umbilical geometry requires it to be below the original top frame and curve up into the tophat space. 

---

### Can I install a new exhaust plate on the tophat back panel?
Yes, but be careful not to snag the umbilicals and have a plan for unplugging wires when removing the tophat.

---

## Cable Management

### I'm getting a lot of "Timer Too Close" errors, what gives?
Common causes:

1. **Flaky crimps**: Check for bad crimps or broken wires, especially on one specific toolhead
2. **High CPU load**: Assign Klipper to a separate core, use performance governor, ensure host isn't overheating
3. **Memory pressure**: Keep memory usage below 60-70%
4. **USB bus saturation**: High-resolution webcams can saturate USB2.0 buses
5. **CAN bus saturation**: LED effects and fine-resolution rounded paths overload the CAN bus
6. **CAN termination**: Ensure 60Ω between CAN High and CAN Low, with only 2 termination resistors (unless using SB2209s)
7. **Klipper version mismatch**: Ensure MCU and host Klipper versions are in sync

---

## Calibration Tools

### My sexball probe doesn't work, it's always triggered
With sensorless homing, ensure endstops/micro switches use ports that don't share pins with motor diag pins (e.g., use Z motor ports). Check your mainboard manual for pin assignments.

---

### My OctoTAP board doesn't trigger reliably
1. Mount PCB as low as possible—push down before tightening screws (screw holes have play)
2. Ensure optical sensor is straight and perpendicular to the board

---

### Do I need to cut the trace on the OctoTAP board?
Generally no. If supplying 5V from the toolhead board, it works fine. Cutting the trace disables the 24V→5V regulator and is only needed if the regulator interferes.

---

### Can I use `SAVE_CONFIG` after `PROBE_CALIBRATE`?
No. `SAVE_CONFIG` saves z-offset at the bottom of printer.cfg, not in the tool's probe section. Manually add probe Z offset values to your tool configuration files.

---

### My Nudge reports "endstop triggered before contact"
Bad electrical connections. Use copper SHCS screws and check resistance between output pins.

---

### Do I need to calibrate offsets on every print?
No. Offsets remain stable unless hardware changes occur (toolhead disassembly, backplate preload screws adjustment, nozzle swap, etc.). Check periodically for drift, especially before long multicolor prints.

---

### What is toolless homing?
Homing with just the shuttle (no tool required). Benefits: park last tool in dock (prevents ooze, keeps umbilicals in arc shape) and move empty shuttle behind bed (gantry out of the way, ready for next print).

To enable toolless homing, set `require_tool_present: False` in the `[toolchanger]` section of your toolchanger-config.cfg. See the [Toolchanger Configuration](../software/ktc-easy/configuration/toolchanger.md#toolchanger) section for more details. 

---

## Software & Configuration

### Installation fails with "invalid syntax" error
Make sure you are using at least Python 3.

---

### Can I use Kalico instead of mainline Klipper?
No, klipper-toolchanger-easy is not currently compatible with Kalico. You must use mainline Klipper.

---

### Will Moonraker updates overwrite my customizations?
Files in `toolchanger/readonly-configs/` will be overwritten when Moonraker updates (these are symlinked macros). Files you can safely edit:
- `toolchanger/toolchanger-config.cfg` - User-editable override file
- `toolchanger/tools/T0.cfg`, `T1.cfg`, etc. - Tool-specific configurations

---

### My KTC easy config files are not visible in mainsail
Click the refresh button manually to refresh the cache.

---

### If using "fan0 or fan2" from slicer, need to change those back to named fans
If your slicer uses "fan0" or "fan2" for fan control, Klipper will throw an error like "Unknown config object 'fan0'" or "fan not found" because klipper-toolchanger-easy uses named fans like `T0_partfan`, `T1_partfan`, etc. Update your slicer settings to use the correct fan names, or disable auxiliary/chamber fans in your slicer settings.

---

### After a tool change the ooze gets deposited onto my print
By default, only the Z axis gets restored after a tool change. To fix:

1. Enable multitool ramming in your slicer
2. Set `t_command_restore_axis: XYZ` in `[toolchanger]`
3. Raise Z travel by a fixed amount (e.g., 5mm) in the pickup_gcode restore path

---

### Can I skip a number in the tool numbering?
No. Klipper requires sequential numbering starting from 0: T0, T1, T2, etc.

---

### The wrong tool heats up
Check *all* `extruder` references are correct per tool. Use `extruder` for T0, `extruder1` for T1, etc. For example, `[tmc2209 extruder]` becomes `[tmc2209 extruder1]` for T1.

---

### I'm getting weird behavior where the wrong tool gets selected, heated, part cooling fan is wrong, etc.
Check for overridden macros. If you copy T0.cfg to T1.cfg, ensure all references to T0 are changed to T1. G-code macro definitions override previously defined ones.

---

### What are these T0, T1, ... macros?
These are automatically created by klipper-toolchanger-easy. `T1` is equivalent to `SELECT_TOOL T=1`. The slicer uses these to initiate tool changes.

---

### Can I park the active tool and not select a new one?
Yes, with `UNSELECT_TOOL`. If the macro is not available, set `require_tool_present: False` in `[toolchanger]`.

---

### I'm getting errors about a T3, I don't even have a T3
This happens when your slicer emits `M106 P3 S0` or `M106 P2 S0`. Disable the chamber exhaust fan and auxiliary cooling in your slicer. Slicers use P2 as auxiliary cooling and P3 as chamber fan, which get interpreted as T2 or T3.

---

### I'm getting a Klipper error about multi_fan or fan_generic
You likely have an older install. The fan reference in each `[tool]` section is now `fan: Tx_partfan` (e.g., `fan: T0_partfan` for T0).

---

### What is SET_TEMPERATURE_WITH_DEADBAND and what value should I set it to?
Default waits until temp settles within 0.5°C before continuing, which can cause delays during toolchanges. A larger deadband increases tolerance to proceed. First, PID tune your hotend properly. Only increase deadband as much as needed—too much can cause print artifacts.

---

### My tool pickup failed and it halted Klipper. Can I make it pause so it can recover and resume?
Use `error_gcode` and `recover_gcode`:

1. Add `PAUSE_BASE` in `error_gcode` (not `PAUSE` if using Mainsail)
2. Fix the toolhead issue and prepare the printer to continue
3. Run `INITIALIZE_TOOLCHANGER RECOVER=1`
4. Add `RESUME_BASE` in `recover_gcode` (not `RESUME` if using Mainsail)

---

## Calibration

### dock_tuner doesn't detect my tool
- Ensure OctoTAP board is properly mounted and optical sensor is aligned
- Tool must be properly seated on the shuttle
- `params_pickup_path` must include a step with `verify:1` parameter
- Test tool detection with `DETECT_ACTIVE_TOOL_PROBE`

---

### Can I use dock_tuner with non-T0 tools?
Yes, but manually place the tool on the shuttle first. **DO NOT** run `G28` or `INITIALIZE_TOOLCHANGER` with non-T0 tools during calibration. Home with T0 first, then manually switch to the tool you want to calibrate.

---

### dock_tuner moves too fast/slow
Adjust speed using the `SPD` parameter: `DOCK_TUNER SPD=0.5` (50% speed) or `DOCK_TUNER SPD=2.0` (200% speed). Be careful with higher speeds to avoid collisions.

---

### The dock positions from dock_tuner don't match my manual calibration
This is normal. dock_tuner provides an interactive way to fine-tune positions. Values should be close to manual calibration but may need slight adjustments.

---

### My pressure advance doesn't work
Put PA values in your filament settings in the slicer. If multitool ramming is enabled, it sets pressure advance to 0 when ramming on the wipe tower, and if it's not in filament settings, it can't restore the value.

---

### I'm getting a move out of range after a tool change
If your slicer has moves close to the edge of the allowable range, switching tools may cause out-of-range moves due to gcode offset differences. Ensure you have enough padding around the edges that accounts for the largest gcode offset of any tool.

---

## Slicers

### PrusaSlicer wipe tower position error after upgrading to 2.9.0
If you use `G1 X{wipe_tower_x} Y{wipe_tower_y} F{travel_speed*60}` in your Tool change G-code, it won't work in PrusaSlicer 2.9.0. Either don't use wipe tower positions, or stick with PrusaSlicer 2.8.1.

---

### OrcaSlicer sets pressure advance to zero with prime tower
There is a bug in OrcaSlicer where it sets pressure advance to zero when using a prime tower. See [OrcaSlicer issue #7594](https://github.com/SoftFever/OrcaSlicer/issues/7594). Use a post-processing script to remove `SET_PRESSURE_ADVANCE ADVANCE=0`, or ensure PA values are set in filament settings.

---

### My tool waits a long time to heat up before continuing
This is likely Klipper waiting for temperature to settle. If your hotend is not well PID tuned, it can oscillate indefinitely. Ensure PID values are properly tuned for each tool.

---

### How do I decrease the prime amount in OrcaSlicer?
Adjust the Prime volume setting in your slicer's multi-material settings. Decreasing width just makes it longer.

---

### Can I use ooze prevention and pre-heating?
Yes! Highly recommended for multi-tool printing. Reduces power draw, prevents oozing, reduces heat creep, and prevents filament degradation.

**OrcaSlicer:** Printer Settings → Multi-material → Ooze prevention
- Temperature variation: 30-50°C below print temperature
- Pre-heat time: 15-30 seconds before tool change

**PrusaSlicer:** Similar settings available. Newer versions can turn off tools completely when no longer needed.

!!! note ""
    Ensure PID values are properly tuned for each tool. If you experience long wait times, adjust the temperature deadband in your `M109` macro or increase pre-heat time.

---

## Endstops

### How do I get my sensorless endstops to work?
See [Voron's sensorless homing guide](https://docs.vorondesign.com/tuning/sensorless.html).

For reliability, use `GET_POSITION` to check for lost steps:
```
G28
G0 X175 Y175
GET_POSITION
G28
G0 X175 Y175
GET_POSITION
```

If the stepper values differ by more than your microstep count, sensorless homing needs more tuning.

---

### What about Z Offset?
See the [calibration section](../calibration/index.md) which covers homing Z, finding Z offset for the first tool, and differences between tools.

---

## Additional Tuning

### Temperatures overshoot or oscillate
Re-run hotend/bed PID at your common temps and `SAVE_CONFIG`.

---

### First layer shifts near certain corners
Likely cable/umbilical tug. Add slack, reclock strain relief, and re-test.

---

### Ringing/ghosting on walls
Lower accel/junction limits or re-run input shaper calibration. Check shuttle to backplate spacing.

---

### Stringing during tool changes
Install nozzle blocker. Adjust retraction. Set slicer to reduce temperature when toolhead not printing.
