
## Common Issues
### INITIALIZE_TOOLCHANGER - Tool Not Recognized
- Check that you have the correct pin assigned to the TAP sensor.
- If the tool initializes while off the shuttle, the logic is flipped. Either add or remove `!` to the pin definition.
- Check wring/crimps.

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

## Community
StealthChanger has an active and growing community of people who are willing to help. If your having trouble finding the information you need. Consider reaching out to our communities on [Discord](https://discord.gg/draftshift){target="_blank"} or [Facebook](https://www.facebook.com/groups/449879874593718/){target="_blank"} and be sure to mention your issue could not be resolved by the information here. We will do our best to accommodate the issue in the future.
