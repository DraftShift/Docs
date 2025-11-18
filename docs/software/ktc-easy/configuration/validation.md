
!!! failure "Klipper Error"
    If you are experiencing Klipper errors after setting up your toolchanger-config and T0 config, please consult [Software Troubleshooting](#).

## Pre Launch
Before configuring and calibrating the other tools, it is advised to get the printer printing with tool 0 before continuing configuration of everything else. Before homing and starting a print, there are some checks we should do to make sure everything behaves as intended.

### Hardware Checks
Make sure your toolhead passes all of the following checks before continuing.

1. When you place the tool on the shuttle the TAP sensor triggers its LED.
2. The part cooling fans turn on with `M106 S127` and off with `M107`.
3. The hotend heats up and the hotend fan turn on with `M104 S200`.
4. Once at temperature, the extruder motor moves with `G1 E100 F100`.
5. finally, Turn the hotend off with `M104 S0`

If any of these steps fails, the issue could be either hardware or software related. Consult the [Hardware Troubleshooting](#) and [Software Troubleshooting].

!!! danger "TODO"
    We should make sure that each of these tests are representing in the troubleshooting guides for both hardware and software.

### Tool detection and homing
1. Check that the tool detection is working by running `INITIALIZE_TOOLCHANGER` with and without the tool on the shuttle. You should get confirmation that the tool was/wasn't detected.
2. With the tool on the shuttle, home the Y axis by running `G28 Y`.
3. Run `G28 X`.
4. Run `G28 Z`.

!!! success
    At this point the printer should be homed and everything is running as intended. 
    
    If you have any issues initializing or homing, please consult [Software Troubleshooting](#).

### Backplate Break In
Because the Stealthchanger’s action relies on precisely fitted pins and bushings, it’s a good idea to operate the mechanism repeatedly to allow the components to seat properly. This break-in process should be performed for every tool.

!!! danger "TODO"
    Figure out a method that also supports eddy current sensors.

1. Heatsoak your printer.
2. Run `G28`
3. Run `QUAD_GANTRY_LEVEL`
3. Run `G28 Z`
2. Run `PROBE_ACCURACY SAMPLES=100`

!!! failure "Failure"
    If you experience failure during this step or you feel the accuracy is not as good as it should be, consult the [troubleshooting](#) section.

Please reference the [Tool Calibration](#).

### Probe offset
The last step before being able to print again is to calibrate your probe offsets. This procedure is different depending on whether you are using TAP or an Eddy current sensor for probing.

=== "TAP"
    1. Home the printer with `G28`.
    2. Run `QUAD_GANTRY_LEVEL`.
    3. Run `G28 Z`.
    4. Run `PROBE_CALIBRATE`.
    5. Change the `z_offset` variable in the tool's [[tool_probe]](#) section.

    !!! caution "SAVE_CONFIG"
        Because klipper-toolchanger-easy reroutes probe to each tool object, when you run `SAVE_CONFIG` it saves the values to `[probe]`. Having a `[probe]` section in your config while also having `[tool_probe]` will cause issues with Klipper. `SAVE_CONFIG` should be avoided.

        If you do save the values, you will need to move the offset from the bottom of `printer.cfg` to your tools `[tool_probe]` section.


=== "Eddy Current"
    Set the probe offset as per your Sensor's documentation.

## First Print
If you copied your [extruder] values from a previous config, you are ready for your first print. If your setting up the printer for the first time, you may need to PID tune your hotend and tune your extruder first.

!!! tip "Extruder Tuning"
    For PID tuning we recommend [Voron's PID Tuning Guide](https://docs.vorondesign.com/build/startup/startup.html?model=v2&step=11&interface=mainsail&probe=tap){:target="_blank"}.

    For extruder calibration we recommend [Ellis' Extruder Calibration Guide](https://ellis3dp.com/Print-Tuning-Guide/articles/extruder_calibration.html){:target="_blank"}.

Run a print as you would for any standard printer first print. As long as the tool is on the shuttle, the printer will behave as any other TAP based printer.

!!! question "Is that it?"
    Getting a single tool printing is much the same as any other printer. We shouldnt bother ourselves with any tool offsets or park positions just yet.
