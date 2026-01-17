# Usermod Data Collection Guide

This guide explains how the usermod gallery automatically collects and displays information about community modifications. Understanding this process will help you ensure your mod displays correctly on the DraftShift documentation site.

## Data Collection Process

The collection script scans the following DraftShift GitHub repositories daily:
- **StealthChanger**
- **ModularDock** 
- **Tophat**
- **DoorBuffer**
- **CableManagement**

For each repository, the script looks for mods in the `UserMods/` directory following this structure:
```
UserMods/
  └── YourUsername/
      └── YourModName/
          ├── README.md (recommended)
          ├── Images/
          ├── STL/
          └── CAD/
```

## What Data is Collected

### 1. Mod Title
- **Source (Priority Order):**
  1. First heading (`# Title`) in your README.md
  2. Folder name (automatically formatted: underscores → spaces, camelCase → separate words)
- **Best Practice:** Add a clear `# Title` as the first line of your README.md
- **If Missing:** Your folder name will be used (e.g., `My_Cool_Mod` becomes "My Cool Mod")

### 2. Thumbnail Image
- **Source (Priority Order):**
  1. First image in your README.md (if it exists in your mod folder)
  2. First image file found in your mod directory
- **Supported Formats:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`
- **Best Practice:** Include an image at the top of your README.md or in your mod folder
- **If Missing:** A placeholder "image missing" icon will be displayed

### 3. Creation Date
- **Source:** Git commit history - the date of the first commit that introduced your mod folder
- **Best Practice:** No action needed - automatically determined from Git history
- **Note:** This is accurate to when your mod was first added to the repository

### 4. README Content
- **Source:** `README.md` or `readme.md` file in your mod folder
- **Best Practice:** Include a detailed README.md with:
  - Clear title (# heading)
  - Description of your mod
  - Installation instructions
  - Images showing your mod
  - Any special requirements or notes
- **If Missing:** Modal will show "No README available" when users click your mod
- **Note:** Relative image paths in your README are automatically converted to absolute URLs

### 5. Images
- **Source:** All image files in your mod folder (including subdirectories)
- **Supported Formats:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`
- **Best Practice:** Organize images in an `Images/` subfolder
- **If Missing:** No image carousel will appear in the modal

### 6. STL Files
- **Source:** All `.stl` and `.3mf` files in your mod folder
- **Best Practice:** Organize STL files in an `STL/` subfolder
- **If Missing:** No STL download links will appear

### 7. CAD Files
- **Source (Priority Order):**
  1. All files in a `CAD/` subfolder (any file type)
  2. Files with CAD extensions anywhere in your mod folder
- **Supported Extensions:** `.step`, `.stp`, `.f3d`, `.f3z`, `.sldprt`, `.obj`
- **Best Practice:** Use a dedicated `CAD/` folder for all source files
- **If Missing:** No CAD download links will appear

### 8. Code Files
- **Source:** Configuration and code files in your mod folder
- **Supported Extensions:** `.py`, `.js`, `.cfg`, `.yaml`, `.yml`, `.json`, `.sh`, `.html`, `.css`, `.c`, `.cpp`, `.h`, and more
- **Best Practice:** Include Klipper config files, macros, or scripts your mod requires
- **If Missing:** No code file links will appear

## Repository Tags

Your mod is automatically tagged with:
- **Repository name** (e.g., StealthChanger, ModularDock)
- **Toolhead compatibility** (if mentioned in your mod name or README)

## Troubleshooting Missing Data

| **Issue** | **Solution** |
|-----------|-------------|
| Wrong title displayed | Add `# Your Mod Title` as the first line in README.md |
| No thumbnail image | Add an image to your README.md or include image files in your mod folder |
| No README content | Create a `README.md` file in your mod folder |
| Images not showing | Ensure image files have supported extensions and are in your mod folder |
| Relative image paths broken | Use relative paths in README (e.g., `./Images/photo.png`) - they're auto-converted |
| No download links | Organize files in `STL/` and `CAD/` subfolders with proper extensions |
| Incorrect creation date | This is determined by Git history and cannot be manually changed |

## Update Frequency

The usermod data is automatically refreshed **daily** via GitHub Actions. Changes to your mod will appear on the site within 24 hours of being merged into the repository.

## Example Mod Structure

Here's an example of a well-organized mod:

```
UserMods/
  └── YourUsername/
      └── AwesomeToolheadMount/
          ├── README.md
          ├── Images/
          │   ├── installed.jpg
          │   ├── assembly.jpg
          │   └── comparison.png
          ├── STL/
          │   ├── mount_left.stl
          │   ├── mount_right.stl
          │   └── spacer.stl
          ├── CAD/
          │   ├── mount.step
          │   └── mount.f3d
          └── Config/
              └── printer.cfg
```

**README.md example:**
```markdown
# Awesome Toolhead Mount

![Installed view](./Images/installed.jpg)

This mount provides improved rigidity and easier assembly for the StealthChanger toolhead system.

## Features
- Reduced part count
- Improved cable routing
- Compatible with standard hardware

## Installation
1. Print all STL files in the STL folder
2. Follow the standard StealthChanger assembly guide
3. Use the provided config snippet in your printer.cfg

## BOM
- 4x M3x8 SHCS
- 2x M3x12 SHCS
```

## Questions or Issues?

If you discover any bugs with the usermod gallery or have questions about how your mod is displayed, please report them via [Discord](https://discord.gg/draftshift) or [Facebook](https://www.facebook.com/groups/449879874593718/).
