# Getting Started

Before diving into your own StealthChanger build, please read the sections below — each covers essential information to ensure a successful and safe build. 

## Power Requirements
Adding more tools increases you power draw. The required wattage for your build will need to be calculated depending on the chosen hardware for each tool by the end user. 

!!! info "Wattage Calculation"
    See the following example of how one could calculate the wattage required for 6 tool heads.

    - Printing heater max output = `70W`
    - Printing fans - 3 total = `(0.1A * 3 fans) * 24V = 7.2W`
    - Resting heater output (30% of max for 5 tools) = `((70W / 100) * 30) * 5 tools = 105W`
    - Resting fans - 5 tools - `(0.1A * 24V) * 5 tools = 12W`
    - Extruder motors - 0.6A for 6 tools - `(0.6A * 24V) * 6 tools = 86W`

    6 tools with a 70w heater has resulted in `280W` total. This greatly exceeds the standard Voron 200W power supply without taking the rest of the system in to account and either an additional power supply is required to make up the difference or the standard power supply needs to be replaced with a larger wattage supply.

!!! danger "Unsure?"
    If you are unsure of your power requirements please reach out for help from the community via one of the social platforms. 

## Printing
All parts for StealthChanger should be printed using the Voron printing recommendation, except the 3d printed shuttle which also requires supports.

* `Layer Height` - 0.2mm
* `Extrusion Width` - 0.4mm, forced
* `Infill Percentage` - 40%
* `Infill Type` - Grid, Gyroid, honeycomb, Triangle or Cubic
* `Wall Count` - 4
* `Solid Top/Bottom Layers` - 5
* `Layer Height` - 0.2mm
* `Supports` - As required

## Print Tuning
Your printer needs to print dimensionally accurate parts due to the tolerances required when meshing multiple pins and bushings together.
It is highly recommended that before printing the shuttle and tool back plates for StealthChanger, your printer and filament be tuned for dimensional accuracy. 

!!! info "But but but, my prints look great!"
    Dimensional accuracy is often overlooked when our printers are making amazing looking parts. If you experience any binding or resistance while meshing the StealthChanger backplate to the shuttle, accuracy is dimensional accuracy is likely the culprit. This becomes even more evident when combining CNC shuttle with a printed tool back plate. 
    
    Many have found great success using [Califlower](https://vector3d.shop/products/califlower-calibration-tool-mk2){:target="_blank"} or one of its [derivatives](https://www.printables.com/search/models?q=califlower){:target="_blank"} to achieve the required dimensional accuracy for these high tolerance pieces.

## Losses
The addition of more tools and docks inside the printer typically means you end up with some lost printable area. On a Voron there should not be a loss in bed space, but while printing underneath the dock there is limited Z travel. These losses change depending on the configuration of the printer, choice of tool and dock.

!!! info "So I can just increase the size of my Z axis to get rid of losses?"
    Increasing the height of the printer is often the first thing that comes to mind when trying to maintain the full printable area, unfortunately it also requires increasing the length of the umbilical for each tool which can become troublesome.

    If you require 100% of your build area, consider instead extending the printer in the Y axis. This will move the docks outside of the printable area of the bed and keep the umbilical at a shorter length as they only need to reach past the bed while at the top of the machine where there is more slack. The extended Y Vorons have been dubbed [Vorlong](https://github.com/DraftShift/StealthChanger/tree/main/UserMods/TheSin-/Vorlong_%2B100y){:target="_blank"}.


## Community
StealthChanger has an active and helpful community on both discord and facebook, if you get stuck at any point, don't hesitate to reach out and ask for help. 

!!! info "User Mods"
    There are many user mods that can modify or enhance the many aspects the StealthChanger ecosystem. If you can't find what your after in the main repository, it's likely one of our talented community members has created a user mod for it.
