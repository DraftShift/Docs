# Contributing Build Guides

This documentation explains how to create and contribute new assembly guides for the DraftShift documentation site. The assembly viewer system uses YAML configuration files paired with 3D models to create interactive step-by-step build guides.

## Table of Contents

- [Folder Structure](#folder-structure)
- [Required Files](#required-files)
- [YAML Configuration Reference](#yaml-configuration-reference)
- [Camera Configuration](#camera-configuration)
- [Part Visibility and Focus](#part-visibility-and-focus)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)

---

## Folder Structure

All build guides are organized under `docs/hardware/guides/` with the following structure:

```
docs/hardware/guides/
├── backplates/
│   ├── anthead/
│   │   ├── data.yml          # Assembly configuration
│   │   ├── Anthead_SF.glb    # 3D model file
│   │   └── index.md          # Overview page
│   └── [other_backplates]/
├── toolheads/
│   ├── anthead/
│   │   ├── data.yml
│   │   ├── Anthead.glb
│   │   └── index.md
│   └── [other_toolheads]/
├── modular_docks/
├── cable_management/
├── calibration_tools/
├── shuttles/
└── tophats/
```

### Category Folders

Each category folder (e.g., `toolheads`, `backplates`) contains individual guide folders. The category name is used by the `get_hardware()` macro to retrieve guide data.

### Guide Folders

Each guide folder must contain:
- **`data.yml`** - The assembly configuration file
- **`[ModelName].glb`** - The 3D model file referenced in `data.yml`
- **`index.md`** - Overview page with embedded assembly viewer

---

## Required Files

### 1. data.yml

The main configuration file that defines the assembly guide. See [YAML Configuration Reference](#yaml-configuration-reference) for details.

### 2. 3D Model (.glb)

A GLB (GL Transmission Format Binary) file containing the 3D model. The model should:
- Have clearly named parts/meshes that match the names used in `visible` and `focus` arrays
- Be optimized for web viewing (reasonable polygon count)
- Include all parts needed for the assembly
- The .glb files can be exported from a .step with Freecad. 
- Import the .glb file in to Blender and export it again using compression.

### 3. index.md

An overview page that includes both overview information and the assembly viewer:

```markdown
# [Guide Name]

{% set assembly = get_hardware("category_name")["Guide Title"] %}

{% include "_templates/overview.md" %}

## Assembly
{% include "_templates/assembly_viewer.md" %}
```

---

## YAML Configuration Reference

### Top-Level Fields

#### `title` (required)
The display name of the assembly guide.

```yaml
title: Anthead
```

#### `model` (required)
The filename of the GLB model file (must be in the same directory).

```yaml
model: "Anthead.glb"
```

#### `image` (optional)
A preview image for the guide (used in overview cards).

```yaml
image: "backplate_anthead_SF.png"
```

#### `summary` (optional)
A description of the assembly. Supports markdown formatting including admonitions.

```yaml
summary: >
  This guide will walk you through the assembly of an Anthead for StealthChanger.
  
  !!! tip "I have a tip for you"
      This is my message
```

#### `printed_bom` (optional)
Bill of materials for printed parts. Each part can have multiple download links.

```yaml
printed_bom:
  Anthead Backplate:
    qty: 1
    urls:
      SF: https://github.com/example/file.stl?raw=true
      HF: https://github.com/example/file_hf.stl?raw=true
  
  Anthead Spacer:
    qty: 1
    urls:
      Link: https://github.com/example/spacer.stl?raw=true
```

#### `hardware_bom` (optional)
Bill of materials for hardware components.

```yaml
hardware_bom:
  M3x6 BHCS Screws:
    qty: 6
  M3 Heat Insert:
    qty: 19
  6x3mm N52 Magnets:
    qty: 2
  Voron Revo Hotend:
    qty: 1
```

#### `primary_parts` (optional)
Array of part names that should be colored with the primary color (default: dark gray).

```yaml
primary_parts:
  - "Main Body"
  - "Backplate"
  - "PCB Mount"
```

#### `accent_parts` (optional)
Array of part names that should be colored with the accent color (default: red).

```yaml
accent_parts:
  - "Duct Right"
  - "Duct Left"
  - "NH Cover Shell"
```

#### `frame_parts` (optional)
Array of part names that should be colored with the frame color (default: very dark gray).

```yaml
frame_parts:
  - "Frame Left"
  - "Frame Right"
```

#### `transparent_parts` (optional)
Object defining parts that should have transparency with opacity values (0.0 to 1.0).

```yaml
transparent_parts:
  "Clear Window": 0.3
  "LED Diffuser": 0.5
```

#### `steps` (required)
Array of assembly steps. See [Step Configuration](#step-configuration) below.

---

### Step Configuration

Each step in the `steps` array defines one stage of the assembly process.

#### Step Fields

##### `title` (required)
The step title displayed to the user.

```yaml
- title: "Install Heatset Inserts"
```

##### `description` (required)
Detailed instructions for the step. Supports markdown formatting.

```yaml
  description: "Install 7 heat inserts into the Main Body using a soldering iron set to 200°C."
```

##### `camera` (required)
Camera position and orientation for this step. See [Camera Configuration](#camera-configuration).

```yaml
  camera:
    azimuth: 214
    polar: 47
    distance: 28
    pan_x: 0.30
    pan_y: 0.92
    pan_z: 0.00
```

##### `visible` (required)
Array of part names that should be visible in this step. Part names must match the mesh names in the GLB model.

```yaml
  visible:
    - "Main Body"
    - "Main Body Heat Inserts"
    - "Backplate"
```

##### `focus` (optional)
Array of part names that should be highlighted (colored with focus color, default: bright green). These parts draw attention to what the user should focus on.

```yaml
  focus:
    - "Main Body Heat Inserts"
```

---

## Camera Configuration

The camera configuration controls the view angle and position for each step. Understanding these parameters is crucial for creating effective assembly guides.

### Camera Parameters

#### `azimuth` (0-360)
Horizontal rotation around the model in degrees.
- **0°** - Front view
- **90°** - Right side view
- **180°** - Back view
- **270°** - Left side view

```yaml
azimuth: 214  # Viewing from the back-left
```

#### `polar` (0-180)
Vertical angle in degrees.
- **0°** - Top-down view
- **90°** - Eye-level view
- **180°** - Bottom-up view

```yaml
polar: 47  # Viewing from above at a 47° angle
```

#### `distance`
Distance from the camera to the model center. Smaller values zoom in, larger values zoom out.

```yaml
distance: 28  # Relatively close view
```

#### `pan_x`, `pan_y`, `pan_z`
Camera pan offsets to center the view on specific parts.
- **pan_x**: Left (-) / Right (+)
- **pan_y**: Down (-) / Up (+)
- **pan_z**: Back (-) / Forward (+)

```yaml
pan_x: 0.30   # Shift view slightly right
pan_y: 0.92   # Shift view up
pan_z: 0.00   # No forward/back shift
```

### Finding Camera Values

To find the correct camera values for your steps:

1. **Enable Camera Overlay**: While viewing your assembly in the browser, press the o key to enable the camera overlay (top-right corner) which shows real-time camera values
2. **Manually Adjust View**: Use mouse controls to position the camera:
   - Left-click drag: Rotate (changes azimuth and polar)
   - Right-click drag: Pan (changes pan_x, pan_y, pan_z)
   - Scroll wheel: Zoom (changes distance)
3. **Copy Values**: Once you have the desired view, click the overlay to copy the values from the camera overlay into your YAML file

### Camera Examples

**Top-down view of heat insert locations:**
```yaml
camera:
  azimuth: 270
  polar: 15
  distance: 35
  pan_x: 0.00
  pan_y: 0.00
  pan_z: 0.00
```

**Close-up angled view of screw installation:**
```yaml
camera:
  azimuth: 124
  polar: 97
  distance: 22
  pan_x: -0.18
  pan_y: -0.46
  pan_z: 0.00
```

**Wide view showing complete assembly:**
```yaml
camera:
  azimuth: 59
  polar: 54
  distance: 87
  pan_x: 1.23
  pan_y: -3.50
  pan_z: 0.00
```

---

## Part Visibility and Focus

Understanding how to control part visibility and focus is key to creating clear assembly instructions.

### Visibility Strategy

**Progressive Assembly**: Show only the parts relevant to the current step. As the assembly progresses, keep previous parts visible to provide context.

```yaml
# Step 1: Just the main body and inserts
- title: "Install Heat Inserts"
  visible:
    - "Main Body"
    - "Heat Inserts"
  focus:
    - "Heat Inserts"

# Step 2: Add the backplate, keep previous parts visible
- title: "Attach Backplate"
  visible:
    - "Main Body"
    - "Heat Inserts"
    - "Backplate"
    - "Backplate Screws"
  focus:
    - "Backplate Screws"
```

### Focus Highlighting

Use `focus` to draw attention to:
- **New parts** being added in the current step
- **Specific locations** where action is required (screw holes, insert locations)
- **Critical alignment points**

**Example: Highlighting new hardware:**
```yaml
- title: "Attach Ducts"
  description: "Secure each duct to the Main Body with 2 M3x8 BHCS screws."
  visible:
    - "Main Body"
    - "Duct Left"
    - "Duct Right"
    - "Duct Screws"
  focus:
    - "Duct Screws"  # Highlight just the screws, not the ducts
```

### Part Naming Conventions

Part names in the GLB model should be:
- **Descriptive**: `"Main Body"` not `"Part_001"`
- **Consistent**: Use the same naming pattern throughout
- **Grouped logically**: Related hardware can share prefixes (e.g., `"Duct Left"`, `"Duct Right"`)

---

## Complete Example

Here's a complete minimal example for a simple assembly guide:

### Directory Structure
```
docs/hardware/guides/example_parts/simple_mount/
├── data.yml
├── SimpleMountModel.glb
├── assembly.md
└── index.md
```

### data.yml
```yaml
title: Simple Mount
model: "SimpleMountModel.glb"

summary: >
  A simple mounting bracket assembly guide demonstrating the basic structure.

printed_bom:
  Mount Bracket:
    qty: 1
    urls:
      Link: https://github.com/example/mount.stl?raw=true

hardware_bom:
  M3x8 BHCS Screws:
    qty: 4
  M3 Heat Inserts:
    qty: 4

primary_parts:
  - "Mount Bracket"

accent_parts:
  - "Mounting Plate"

steps:
  - title: "Install Heat Inserts"
    description: "Install 4 heat inserts into the Mount Bracket using a soldering iron."
    camera:
      azimuth: 45
      polar: 60
      distance: 30
      pan_x: 0.00
      pan_y: 0.00
      pan_z: 0.00
    visible:
      - "Mount Bracket"
      - "Heat Inserts"
    focus:
      - "Heat Inserts"

  - title: "Attach Mounting Plate"
    description: "Secure the Mounting Plate to the bracket using 4 M3x8 BHCS screws."
    camera:
      azimuth: 315
      polar: 75
      distance: 35
      pan_x: 0.00
      pan_y: 0.50
      pan_z: 0.00
    visible:
      - "Mount Bracket"
      - "Heat Inserts"
      - "Mounting Plate"
      - "M3x8 BHCS Screws"
    focus:
      - "M3x8 BHCS Screws"

  - title: "Complete"
    description: "Your mount is now ready for installation!"
    camera:
      azimuth: 30
      polar: 65
      distance: 40
      pan_x: 0.00
      pan_y: 0.00
      pan_z: 0.00
    visible:
      - "Mount Bracket"
      - "Heat Inserts"
      - "Mounting Plate"
      - "M3x8 BHCS Screws"
```

### assembly.md
```markdown
# Simple Mount Assembly

{% set assembly = get_hardware("example_parts")["Simple Mount"] %}
{% include "_templates/assembly_viewer.md" %}
```

### index.md
```markdown
# Simple Mount

{% set assembly = get_hardware("example_parts")["Simple Mount"] %}

{% include "_templates/overview.md" %}

## Assembly
{% include "_templates/assembly_viewer.md" %}
```

---

## Best Practices

### 1. Model Preparation
- **Optimize polygon count**: Keep models web-friendly (aim for under 100k polygons)
- **Name meshes clearly**: Use descriptive names that make sense in the context
- **Separate hardware**: Create individual meshes for screws, inserts, etc.
- **Test the model**: Load it in the viewer before creating all steps

### 2. Step Organization
- **Logical progression**: Follow the natural assembly order
- **One action per step**: Don't combine multiple unrelated actions
- **Clear descriptions**: Be specific about quantities, orientations, and techniques
- **Consistent terminology**: Use the same terms throughout the guide

### 3. Camera Positioning
- **Frame the action**: Center the camera on what the user needs to see
- **Appropriate zoom**: Close enough to see details, far enough for context
- **Consistent angles**: Use similar angles for similar operations
- **Test on mobile**: Ensure views work on smaller screens

### 4. Part Visibility
- **Show context**: Include previously assembled parts for reference
- **Minimize clutter**: Hide parts that obstruct the view
- **Use focus wisely**: Highlight only the most important parts
- **Progressive disclosure**: Reveal parts as they become relevant

### 5. Documentation
- **Include warnings**: Call out critical steps or common mistakes
- **Reference other guides**: Link to related assembly guides when appropriate
- **Provide alternatives**: Document different options where applicable
- **Add tips**: Include helpful hints from your experience

### 6. Testing
- **Walk through the guide**: Follow your own instructions step-by-step
- **Check all links**: Verify BOM URLs work correctly
- **Test in the viewer**: Ensure all parts appear correctly
- **Get feedback**: Have someone else try to follow the guide

### 7. Markdown Features
You can use markdown formatting in descriptions:

```yaml
description: |
  Install the screws in this order:
  
  1. Top left
  2. Top right
  3. Bottom left
  4. Bottom right
  
  **Important:** Do not overtighten!
```

You can also use admonitions in the summary:

```yaml
summary: >
  This is a complex assembly.
  
  !!! warning "Take Your Time"
      This step requires precision. Rushing may damage components.
  
  !!! tip "Pro Tip"
      Pre-threading the heat inserts makes installation easier.
```

---

## Troubleshooting

### Parts Not Appearing
- Verify part names in YAML exactly match mesh names in GLB
- Check for typos and case sensitivity
- Ensure the GLB file is in the same directory as data.yml

### Camera Position Issues
- Use the camera overlay to find correct values
- Remember that pan values can be negative
- Test the view at different screen sizes

### Model Loading Slowly
- Reduce polygon count in your 3D modeling software
- Optimize textures (use smaller images)
- Consider splitting very complex models

### Colors Not Applying
- Check that part names are in the correct color arrays
- Verify part names match exactly (case-sensitive)
- Remember that focus color overrides other colors

---

## Contributing Your Guide

Once your guide is complete:

1. **Test thoroughly**: Walk through the entire assembly
2. **Check formatting**: Ensure YAML is valid (use a YAML validator)
3. **Verify files**: Confirm all required files are present
4. **Create a pull request**: Submit your guide to the repository
5. **Provide context**: Include a description of what the guide covers

---

## Additional Resources

- **MkDocs Material**: [https://squidfunk.github.io/mkdocs-material/](https://squidfunk.github.io/mkdocs-material/)
- **YAML Syntax**: [https://yaml.org/spec/1.2/spec.html](https://yaml.org/spec/1.2/spec.html)
- **GLB Format**: [https://www.khronos.org/gltf/](https://www.khronos.org/gltf/)
- **Three.js Documentation**: [https://threejs.org/docs/](https://threejs.org/docs/)

---

## Questions or Issues?

If you encounter problems or have questions about contributing guides:
- Open an issue on the GitHub repository
- Check existing guides for reference examples
- Reach out to the community for assistance

Thank you for contributing to the DraftShift documentation!
