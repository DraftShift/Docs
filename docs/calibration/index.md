# Calibration Overview



Calibration requires three main steps:

1. [Probe Offset](probe_offset.md)
2. [Dock Positions](dock_positions.md)
3. [G-code Offsets](gcode_offsets.md)

This page is a high-level overview. Use it to understand what needs to be calibrated and where it lives in the config before diving into the step-by-step guides.

---

## 1. [Probe Offset](probe_offset.md)

The first step is establishing a **probe-based Z reference** for each tool.

- **Config section:** `[tool_probe Tn]` in your tool config
- **Parameter:** `z_offset`

### What is `z_offset`?

The `z_offset` is used when the printer homes or levels the bed, it tells Klipper the vertical distance between your probe's trigger point and the nozzle tip.

Klipper uses this offset to calculate where Z=0 is for that specific nozzle.

Each tool could have a different `z_offset` because:

- Assembly tolerances can differ.
- Travel between the nozzle's zero point and the sensor's trigger point can vary


With correct `z_offset` values, consistent first layers are produced.

---

## 2. [Dock Positions](dock_positions.md)

Dock calibration is required for the printer to know where to pick up and park tools in their docks.


- **Config section:** `[tool Tn]` in your tool config
- **Parameters:** `params_park_x`, `params_park_y`, `params_park_z`
### What are park positions?

The park position is the exact X/Y/Z coordinate where the shuttle aligns with a docked tool so they can mechanically couple. Think of it as the "pickup point" for that specific dock.

**Why each tool needs its own park position:**

- Docks are physically mounted at different locations along the front of the printer
- Even small positional errors can cause the shuttle to miss the tool or collide with the dock

With accurate park positions, tool changes become repeatable and collision-free.

---

## 3. [G-code offsets](gcode_offsets.md)

Finally, you align where each nozzle actually prints so that tools agree on Z height and X/Y position on the bed.

- **Config section:** `[tool Tn]`
- **Parameters:** `gcode_z_offset`, `gcode_x_offset`,  `gcode_y_offset`


### What are G-code offsets?

G-code offsets compensate for the physical differences between tools so they all behave as if they're in the same position:

- **`gcode_z_offset`**: Adjusts the effective Z height so all tools produce the same first-layer squish.

- **`gcode_x_offset` and `gcode_y_offset`**: Shift the tool's X/Y position so all nozzles land on the same spot when given identical G-code coordinates. Without these, a multi-tool print would have visible misalignment between layers printed by different tools.

**Why G-code offsets matter:**

When your slicer generates `G1 X100 Y100`, every tool should deposit filament at exactly the same physical location on the bed. G-code offsets make this possible by telling Klipper "this tool is 0.2mm left and 0.1mm forward off the reference tool, so adjust accordingly."

### Calibration Methods

There are several ways to measure these offsets:

- **[Manual](https://www.printables.com/model/201707-x-y-and-z-calibration-tool-for-idex-dual-extruder){:target="_blank"}** - Measuring the physical distance between nozzle with a printed tool
- **[SexBall Probe](/hardware/calibration_tools/#sexball-probe)** – Mechanical probe using precision spheres for repeatable measurements
- **[Axiscope](https://github.com/nic335/Axiscope){:target="_blank"}** – Camera-based visual alignment to printed targets
- **[Nudge](https://github.com/zruncho3d/nudge){:target="_blank"}** – Software-guided iterative calibration using printed patterns
