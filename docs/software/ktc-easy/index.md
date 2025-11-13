
## Summary
[Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"} enhances [Klipper](#){:target="_blank"} by adding tool-changing support. It works through a combination of Python modules and macros that coordinate tool management and calibration. Key features include:

* Comprehensive tool-change framework — Adds full multi-tool management to Klipper, including tool selection, pickup, and parking logic.
* Per-tool configuration — Supports unique settings for each tool, such as offsets, fans, heaters, and extruder assignments.
* Tool detection and verification — Sensor-based checks ensure the correct tool is mounted after a change.
* Per-tool calibration support — Enables probing and calibration of XYZ offsets for each individual toolhead.
* Advanced motion handling — Includes a “rounded path” module to smooth travel paths and reduce mechanical stress during tool changes.
* Deadband heating — Adds less strict heating requirements to increase tool change speeds

## Prerequisites
Before installing [Klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy){:target="_blank"}, it is recommended that you first have a functional klipper based 3d printer. 
