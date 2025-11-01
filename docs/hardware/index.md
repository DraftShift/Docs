
## StealthChanger
StealthChanger consists of 2 major components, the `shuttle` and `backplate`. The `shuttle` gets attached the the printers gantry, while the `backplate` gets attached to the back of each tool. With the use of steel pins and brass bushings, the two pieces enable any Voron 2.4 or Micron 180 to become a tool changer.

| StealthChanger<br>Printed Shuttle | StealthChanger<br>CNC Shuttles | StealthChanger<br>Backplate |
| :-: | :-: | :-: |
| ![Placeholder]() | ![Placeholder]() | ![Placeholder]() |

The printed `shuttle` can be mounted to the rail using one of two methods: either by clamping the belts directly behind the `shuttle` with the aid of `Belt Helper` or by using a `Shuttle Keeper` positioned between the shuttle and the rail. CNC shuttles, however, utilize their own belt-clamping system.

## Modular Dock
The Modular Dock has been designed in a way where it can be used with any toolhead and can be configured to fit the needs of the printer. Because of its modularity, it can become tricky to figure out which parts are needed for a specific configuration. The following table will help you understand the different configurations and their requirements.

??? info "Dock Terminology"
    * `stubby` - Refers to the depth of the dock (Y axis) being less than `standard` and is only for machines not running Door Buffer. `stubby` is not available for all toolheads.

    * `short` - Refers to the height of the dock (Z axis) being less than `standard`. For Voron printers, the shorter height is not available for larger toolheads. For Micron printers the `short` variant is a requirement.

    * `wide` - Refers to the width of the dock (X axis) being more than `standard`. This is not something that is optional. Depending on the toolhead, the dock will be wider if required.

    * `standard` - The configuration that will work on any Voron printer, but may incur unnecessary losses in printable area.

    * `frame` - The upright portion of the dock that connects to the printers frame and optionally a crossbar.

    * `base` - The section that the tools rests on while docked.

    * `backplate` - Attaches to the rear of the base to allow adjustment of the tools resting position.

    * `blocker` - A section that mounts inside the `base` that blocks the nozzle while docked which helps with ooze control.

    * `wiper` - A means of wiping the nozzle as the toolhead is exiting the dock.

| Standard Height<br>Standard Depth| Standard Height<br>Stubby Depth | Short Height<br>Standard Depth| Short Height<br>Stubby Depth |
| :-: | :-: | :-: | :-: |
| ![Standard-Standard](/assets/dock_z-standard_y-standard.png) | ![Standard-Stubby ](/assets/dock_z-standard_y-short.png) | ![Short-Standard](/assets/dock_z-short_y-standard.png) | ![Short-Stubby ](/assets/dock_z-short_y-short.png) |

<!-- | Blocker - Cup | Blocker - Spring Steel |
| :-: | :-: |
| ![Cup](/assets/dock-cup_blocker.png) | ![Spring Steel](/assets/dock-spring_blocker.png) |

| Wiper - PTFE | Wiper - Bambu |
| :-: | :-: |
| ![PTFE](/assets/dock-ptfe_wiper.png) | ![Bambu](/assets/dock-bambu_wiper.png) | -->

## Door Buffer
Adding a crossbar for docking adds a great amount of stability to the docks, but it can create an issue where the gantry can no longer reach the tools in the dock. The solution is to add a buffer on the front of the printer, moving the crossbar and the tools out further. This also has the added benifit of regaining more of the lost printable area.

| Idler Interference | Door Buffer Solution |
| :-: | :-: |
| ![Idler interference](/assets/idler_interference.png) | ![Door buffer solution](/assets/door_buffer_solution.png) |
| The extruder idler can interfere with the cross bar as shown above | Using a door buffer resolves the this issue |

!!! tip "Alternatives"
    If a Door Buffer is not your thing, there is an alternative usermod solution in the form of shortened front idlers. They are called [MiniBFI and MicroBFI](https://github.com/DraftShift/StealthChanger/tree/main/UserMods/BT123/MiniBFI%20%2B%20MicroBFI), for Voron and Micron respectively. They eliminate the requirement for a Door Buffer at the expense of shorter idler adjustment.

## Tophat
The Tophat raises the top panel of the printer to allow room for the tool's umbilicals. There are both 3d printed and hardware options available.

| Extrusion Version | Printed Version |
| :-: | :-: |
| ![Extrusion Version](/assets/tophat_extrusion.png) | ![Printed Version](/assets/tophat_printed.png) |

## Cable Management
Management of the extra cable and filament routes required by StealthChanger. 

## Collaborations
We have collaborated with the following vendors to bring CNC StealthChanger components and kits to the community.

* [Fysetc](https://www.fysetc.com/products/fysetc-stealthchanger-cnc-shuttle-kit-sb-combo-v2-board-tool-distribution-board-h36-board)

* [LDO Motors](https://docs.ldomotors.com/en/StealthChanger)