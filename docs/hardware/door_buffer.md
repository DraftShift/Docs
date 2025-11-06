---
search:
  boost: 2 
---


## Context

### The Problem
To give the [Modular Docks](#) the maximum amount of rigidity, they need to be supported above and below. Adding an extrusion [crossbar](#) solves that problem but also introduces another. With the crossbar in line with the frame the Voron idlers collide with the crossbar and moving the extrusion outside of the frame doesn't allow the door to be mounted anymore.

![Idler interference](/assets/idler_interference.png)

### The Solution
Adding a Door Buffer provides a means to install the [crossbar](#) and retain the ability to mount the door on the front. The Door Buffer uses 3d printed pieces to fill the gaps around the front of the printers frame and adds new mounting points for the door.

![Door buffer solution](/assets/door_buffer_solution.png)

!!! info "Alternatives"
    You don't necessarily need to use printed pieces to act as a buffer. There are some other methods that the community uses.

    * **2020/1515 Extrusion** - Using blind joints you can mount extrusion to the front of the frame essentially making it 4020/3015.
    * **4020/3015 Extrusion** - Build the front of your printers frame using larger extrusion. 
    * **Mini/Micro BFI** - [Mini/Micro BFI](#) takes a different approach and shortens the BFI idlers. This means the [crossbar](#) can be kept within the printers frame at the cost of less printable area and reduces how much you can adjust the AB belts.

# Crossbar
The crossbar should be made from extrusion that matches your printer, 2020 for Voron or 1515 for Micron. The length of the crossbar changes depending on the size of your frame and which version of Door Buffer you are using.

| Printer | DraftShift Crossbar | LDO Crossbar |
| --- | --- | --- |
| Voron 250 | 400mm | 370mm |
| Voron 300 | 450mm | 420mm |
| Voron 350 | 500mm | 470mm |
| Micron 180 | TODO | - |

!!! tip "Crossbar Adapter"
    You can use the DraftShift Door Buffer with LDO length extrusions by using an [adapter](#).

## BOM

### Printed

### Hardware

## Assembly

