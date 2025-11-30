### Probe offset
Before being able to print, it is nesacerry to calibrate your probe offsets. This procedure differs depending on whether you are using the OptoTap Sensor or an Eddy current sensor for probing.

=== "TAP"
    ``` cfg title="[tool_probe] example." hl_lines="4"
        [tool_probe T0]
        pin: NHK0:gpio10
        tool: 0 # change to the index of the tool. 0, 1, 2, etc.
        z_offset = -1.05 # Needs to be calibrated. More positive = More Squish
    ```

    1. Ensure that your `[tool_probe]` section's `z_offset` variable is set to `0`.
    2. Home the printer with `G28`.
    3. Run `QUAD_GANTRY_LEVEL`.
    4. Run `G28 Z`.
    5. Run `PROBE_CALIBRATE`.
    6. Change the `z_offset` variable in the tool's `[tool_probe]` section.

    !!! warning "SAVE_CONFIG"
        Because klipper-toolchanger-easy reroutes probe to each tool object, when you run `SAVE_CONFIG` it saves the values to `[probe]`. Having a `[probe]` section in your config while also having `[tool_probe]` will cause issues with Klipper. `SAVE_CONFIG` should be avoided.

        If you do save the values, you will need to move the offset from the bottom of `printer.cfg` to your tools `[tool_probe]` section.

=== "Eddy Current"
    Set the probe offsets as per your sensor's documentation.