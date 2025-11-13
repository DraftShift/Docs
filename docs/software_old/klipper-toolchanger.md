# Easy-Klipper Toolchanger

This guide covers the installation and configuration of the klipper-toolchanger-easy plugin for StealthChanger systems.

## Overview

The [klipper-toolchanger-easy](https://github.com/jwellman80/klipper-toolchanger-easy) fork simplifies the installation process by combining configuration, macros, and Python code into a single repository. It provides patterns for overriding configuration to ease installation and allow easier updates.

!!! info "Prerequisites"
    This assumes you have a **WORKING PRINTER and configuration** before starting the toolchanger installation.

!!! warning "Important"
    All of the StealthChanger documentation still applies and should be followed (except the installation portion). See the [StealthChanger Wiki](https://github.com/DraftShift/StealthChanger/wiki) for complete documentation.

---

## Installation

### Step 1: Install the Plugin

Run the installation script over SSH. This script will:

- Symlink Python files into `klipper/klippy/extras`
- Symlink G-code macros to `~/printer_data/config/toolchanger/readonly-configs`
- Copy example tools into `~/printer_data/config/toolchanger/tools`
- Copy user-editable config into `~/printer_data/config/toolchanger`

```bash
cd ~/
git clone https://github.com/jwellman80/klipper-toolchanger-easy.git
cd ~/klipper-toolchanger-easy
./install.sh
```

!!! tip "Safe to Re-run"
    Running `install.sh` multiple times is safe, provided you follow the configuration instructions below.

### Step 2: Update printer.cfg

Add the following to your `printer.cfg`:

```cfg
[include toolchanger/readonly-configs/toolchanger-include.cfg]
```

### Step 3: Enable Automatic Updates (Optional)

Add the following to your `moonraker.conf` to enable automatic updates:

```cfg
[update_manager klipper-toolchanger-easy]
type: git_repo
channel: dev
path: ~/klipper-toolchanger-easy
origin: https://github.com/jwellman80/klipper-toolchanger-easy.git
managed_services: klipper
primary_branch: main
```

### Updating with New Files

!!! note "Manual Update Required"
    If an update adds new Klipper files, they **will not** be automatically installed. You must run the install script manually:
    
    ```bash
    bash ~/klipper-toolchanger-easy/install.sh
    ```

---

## Basic Configuration

### Minimum Requirements

At a minimum, you need to:

1. **Set dock positions** for each tool in the `toolchanger/tools/Tx.cfg` files
2. **Configure settings** in `toolchanger-config.cfg`:
   - `homing_override_config`
   - `_CALIBRATION_SWITCH` (if using a calibration probe, set its position here and update `tools_calibrate`)

### Tool Configuration Files

Tool configs must be named `Tx.cfg` (e.g., `T0.cfg`, `T1.cfg`, etc.)

!!! example "Tool Configuration Differences"
    - **T0**: Has a `z_offset` but no `gcode_offsets`
    - **T1+**: Have `gcode_offsets` set but no `z_offset`
    
    Other than these differences, the configuration between tools is very similar. Follow the examples in `example_T0.cfg` and `example_T1.cfg`.

### Important Configuration Notes

!!! warning "Do Not Edit Read-Only Files"
    **DO NOT EDIT** files in `~/printer_data/config/toolchanger/readonly-configs`
    
    If you need to modify or configure something in those files, use the `~/printer_data/config/toolchanger/toolchanger-config.cfg` file to override the macro or setting. This file has examples of how to accomplish this.

!!! info "TAP Z-Probing"
    If using TAP for Z probing, you will need a tool on the shuttle when starting up or Klipper will shut down. You should always home, Quad Gantry Level, and bed mesh with T0.

---

## Upgrading from Old Klipper Tool Changer Easy

If you're upgrading from the old version, see the [upgrade instructions](https://github.com/jwellman80/klipper-toolchanger-easy/blob/main/upgrade.md) in the repository.

---

## File Structure

After installation, your configuration will be organized as follows:

```
~/printer_data/config/toolchanger/
├── readonly-configs/          # DO NOT EDIT - Symlinked macros
│   └── toolchanger-include.cfg
├── tools/                     # Tool-specific configurations
│   ├── T0.cfg
│   ├── T1.cfg
│   └── ...
├── toolchanger-config.cfg     # User-editable overrides
└── example_T0.cfg             # Example configurations
    example_T1.cfg
```

!!! tip "Configuration Override Pattern"
    Use `toolchanger-config.cfg` to override any settings from the read-only configs. This allows you to update the plugin without losing your customizations.

---

## Common Configuration Tasks

### Setting Dock Positions

Edit each tool's config file (`toolchanger/tools/Tx.cfg`):

```cfg
[tool Tx]
tool_number: x
params_park_x: 23.0
params_park_y: 3.0
params_park_z: 310.0
```

### Configuring Homing Override

In `toolchanger-config.cfg`, configure your homing behavior:

```cfg
[gcode_macro homing_override_config]
# Add your homing override configuration here
```

### Setting Up Calibration Probe

If using a calibration probe, configure its position in `toolchanger-config.cfg`:

```cfg
[gcode_macro _CALIBRATION_SWITCH]
variable_x: 150.0
variable_y: 150.0
variable_z: 10.0
```

---

## Troubleshooting

!!! warning "Klipper Shutdown on Startup"
    If Klipper shuts down on startup and you're using TAP for Z-probing, ensure you have a tool mounted on the shuttle before starting.

!!! tip "Always Use T0 for Leveling"
    Always perform homing, Quad Gantry Level, and bed mesh operations with T0 to ensure consistent results.

---

## Additional Resources

- [klipper-toolchanger-easy GitHub](https://github.com/jwellman80/klipper-toolchanger-easy)
- [StealthChanger Wiki](https://github.com/DraftShift/StealthChanger/wiki)
- [Original Klipper Toolchanger](https://github.com/viesturz/klipper-toolchanger)
