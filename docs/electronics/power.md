## Requirements
Every toolchanger build is different, the end user must calculate the required power budget based on the specific hardware selected for each toolhead. This includes considering peak loads, simultaneous heating, and any auxiliary accessories. Ensuring that the power supply is sized with adequate overhead prevents instability and brownouts.

!!! example "Wattage Calculation"
    The following calculations are theoretical and are provided only as an example of how one might estimate the power requirements for a 6 tool build. Actual values may vary depending on the specific components, settings, and operating conditions of your build.

    
    - Toolheads - Active heater at max output = `70W`
    - Toolheads - Resting heater output (30% of max for 5 tools) = `((70W / 100) * 30) * 5 tools = 105W`
    - Toolheads - Active part cooling fans - 2 total = `(0.1A * 2 fans) * 24V = 4.8W`
    - Toolheads - Active hotend fans - 6 total = `(0.1A * 6 fans) * 24V = 14.4W`
    - Toolheads - Extruder motors - 0.6A for 6 tools - `(0.6A * 24V) * 6 tools = 86W`
    - Toolheads - combined total = `280,2W`  

    - Printer baseline = `120W`
    - Combined total = `400,2W`

In this example, 6 toolheads equipped with 70W heaters produce a combined load of 280W@24V. This alone exceeds the standard Voron 200W-24V power supply before accounting for motion stepper motors, electronics, fans, and other system components which would typically consume around 100-120W@24V.

So be safe and choose an adequately rated PSU for your expected current consumption.

!!! warning "Current Draw Baseline and Spikes"
    A standard Voron v2 draws somewhere in the 50-120w range "just sitting there" with all heaters and fans off, make sure you account for your baseline and spikes when you run the numbers for your power consumption.

!!! warning "DC Beds"
    A typical Voron has an AC bed, which does not draw power from the printer's PSU. If you have a DC bed, you will need to include that in your power calculations and spec the PSU accordingly.

In practice, this means that either an [additional power supply](#additional-power-supplies) would be required to cover the extra demand, or the stock supply must be [replaced with a higher-wattage unit](#replacement-power-supplies). These figures are illustrative; your actual power requirements will depend on the specific hardware and configuration of your build.

!!! danger "Unsure?"
    If you are unsure of your power requirements please reach out for help from the community via one of the social platforms. 

## Additional Power Supplies
A common method for increasing available power capacity is to add a second power supply unit (PSU) to the printer. While this approach is straightforward, it comes with both advantages and trade-offs:

- **Cost-effective:** Allows you to retain your existing PSU and supplement only the additional power required.
- **Increased space requirements:** A second PSU occupies additional room within the electronics bay.
- **Additional wiring complexity:** Integrating multiple PSUs introduces more wiring and requires careful planning to ensure safe, reliable operation.

!!! info "Common Ground"
    In multi-PSU systems, it is recommended to connect the negative (ground) rails together. This prevents floating grounds, which can lead to communication issues, inconsistent sensor readings, and other electrical irregularities.

!!! tip "48 Volt"
    If you’re adding another power supply and your motor drivers support it, incorporating a 48 V PSU can improve motion performance—particularly for Z-axis travel. Higher voltage reduces motor torque loss at speed, enabling faster and more responsive movement.

    Ultimately, upgrading to 48 V motion can shorten tool-change times and may be a worthwhile improvement depending on your hardware capabilities and performance goals.

## Replacement Power Supplies
Replacing your existing power supply unit (PSU) offers the inverse set of trade-offs compared to adding an [additional PSU](#additional-power-supplies). While it is generally the more expensive option, a single higher-capacity PSU can free up space in the electronics bay and reduce overall wiring complexity. Someone seeking a cleaner, more streamlined setup and prefers to avoid managing multiple power sources, a full PSU replacement may be the more appealing path.

## Power Supply Options
See the below table for some of the more common power supply unit (PSU) options. All PSUs are available in 24V and 48V options, unless noted otherwise.

{% for mf in power_supplies %}
### {{ mf }}
| Model | Wattage | Dimensions |
| :-: | :-: | :-: |
{%- for model, data in power_supplies[mf].items() %}
| {{ model }} | {{ data.wattage }} | {{ data.dimensions|join(", ") }}mm |
{%- endfor %}
{% endfor %}