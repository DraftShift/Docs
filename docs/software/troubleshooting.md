
## Common Issues

### HomingViaProbeHelper.__init__() missing 1 required positional argument: 'param_helper'

!!! info "UPDATE"
    As of 4 Feb 2026 klipper-toolchanger-easy has been updated to support the changes made to probe in Klipper. Update klipper-toolchanger-easy to the latest version to resolve this issue. 

Klipper made changes 25 Jan 2026 to probe that require klipper-toolchanger to be updated. You can revert Klipper to before the breaking changes by running the following commands in terminal.

``` bash {.copy}
    sudo service klipper stop
    cd ~/klipper
    git checkout e605fd18560fbb5a7413ca12b72325ad4e18de16
    sudo service klipper start
```


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

### Heater extruder1 not supported
- are you using elis bed fan macro's?
- at line 53 of [bedfans.cfg](https://github.com/VoronDesign/VoronUsers/blob/8e5067f4f6457da8a552983dd210ec48c40be2ca/printer_mods/Ellis/Bed_Fans/Klipper_Macros/bedfans.cfg#L53){:target="_blank"}
- change it from `{action_respond_info("Heater %s not supported" % HEATER)}` to `_SET_HEATER_TEMPERATURE {rawparams}`
 
 Big thank you to BrewNinja on Discord for sharing this fix.

---

{% include "_templates/community_help.md" %}
