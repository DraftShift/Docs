# Power and Electronics

Building a toolchanger naturally increases both the [power demand](power.md) and the amount of I/O the printer must support. Each toolhead typically needs its own heater, extruder, fans, and OptoTap PCB, which quickly makes direct wiring complex and unwieldy.

The most effective way to manage this is to use a [toolhead board](th_boards.md) on each tool, which keeps all of the tool’s wiring self-contained within the toolhead itself. Complementing this, [distribution boards](distro_boards.md) serve as centralized hubs that deliver both power and data to each toolhead board, typically over CAN bus or USB. Together, these boards simplify wiring, improve reliability, and make multi-tool systems far easier to build and maintain.