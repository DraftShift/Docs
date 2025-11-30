
## Clone and Install
Connect to the printer via SSH and enter the following commands:

``` bash { .copy }
cd ~/
git clone https://github.com/jwellman80/klipper-toolchanger-easy.git
cd ~/klipper-toolchanger-easy
./install.sh
```

You will be prompted to decide a Z probe solution. A typical StealthChanger uses the built-in tap sensor for probing and option 1 should be chosen.

``` bash
1. I will use the TAP sensor as my Z probe on each tool
2. I will use a shuttle mounted Beacon/Cartographer/Eddy/etc as my Z probe
```

!!! example "Eddy Current"
    Eddy current sensors on StealthChanger have additional requirements and some limitations, they are considered experimental. 

## File Structure
After installation, your configuration will be organized as follows:

```
~/printer_data/config/toolchanger/
├── readonly-configs/           # DO NOT EDIT - Symlinked macros
│   ├── homing.cfg
│   ├── tool_detection.cfg      # TAP install only
│   ├── toolchanger.cfg
│   ├── toolchanger-macros.cfg
│   ├── calibrate-offsets.cfg
│   ├── crash-detection.cfg
│   └── toolchanger-include.cfg
├── tools/                      # Tool-specific configurations
│   ├── example_T0.cfg          # Example configurations
│   └── example_T1.cfg
└── toolchanger-config.cfg      # User-editable overrides
```

## Include Configs
Include the configuration by adding the following to the start of your `printer.cfg`
``` cfg { .copy }
[include toolchanger/readonly-configs/toolchanger-include.cfg]
```

## Moonraker Config
Optional, but recommended, add the following to your `moonraker.conf` to enable automatic updates:

``` cfg { .copy }
[update_manager klipper-toolchanger-easy]
type: git_repo
path: ~/klipper-toolchanger-easy
origin: https://github.com/jwellman80/klipper-toolchanger-easy.git
managed_services: klipper
primary_branch: main
```
