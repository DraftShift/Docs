Something go wrong?


## INITIALIZE_TOOLCHANGER - Tool Not Recognized
- Check that you have the correct pin assigned to the TAP sensor.
- If the tool initializes while off the shuttle, the logic is flipped. Either add or remove `!` to the pin definition.
- Check wring/crimps.

## Wrong part cooling fans turn on
- Check the `fan` assignment in the [[tool]](#) section.

## Wrong extruder heats up
- Check the `extruder` assignment in the [[tool]](#) section.
- Check the `activate_gcode` extruder in the [[tool_probe]](#) section.

