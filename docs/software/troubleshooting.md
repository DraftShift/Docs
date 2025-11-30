
## Common Issues
### INITIALIZE_TOOLCHANGER - Tool Not Recognized
- Check that you have the correct pin assigned to the OptoTap sensor.
- If the tool initializes while off the shuttle, the logic is flipped. Either add or remove `!` to the pin definition.
- Some OptoTap sensors require a pullup to operate. Try adding a `^` to the pin definition.
- Check wring/crimps.

---

### INITIALIZE_TOOLCHANGER - Wrong Tool Recognized
- Check the `tool_number` assignment in the [[tool]](ktc-easy/configuration/tool.md#tool) section.

---

### Wrong hotend fan turns on
- Check the `extruder` assignment in the [[heater_fan]](ktc-easy/configuration/tool.md#heater_fan) section.

---

### Wrong part fans turn on
- Check the `fan` assignment in the [[tool]](ktc-easy/configuration/tool.md#tool) section.

---

### Wrong hotend heats up
- Check the `extruder` assignment in the [[tool]](ktc-easy/configuration/tool.md#tool) section.
- Check the `activate_gcode` extruder in the [[tool_probe]](ktc-easy/configuration/tool.md#tool_probe) section.

---

### Wrong extruder moves
- Check the `extruder` assignment in the [[tool]](ktc-easy/configuration/tool.md#tool) section.
- Check the `extruder` name of the [[tmc2209]](ktc-easy/configuration/tool.md#tmc2209) section.

---

{% include "_templates/community_help.md" %}
