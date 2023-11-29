# OpenRCT2/OpenGraphics

**OpenGraphics** is a project established to replace the base graphics of Rollercoaster Tycoon 2. The aim is to create a set of freely-useable graphics that can be used with [OpenRCT2](https://github.com/OpenRCT2/OpenRCT2). This will help OpenRCT2 to be more accessible, as well as make it easier to add new features and content to the game.

## Progress

Our current focus is on the following object categories:
- Small scenery (non-vegetation)
- Large scenery
- Walls
- Food/Drink/Merchandise stalls

Current blockers
- Peep Model, any object/sprites that involve the peep model (e.g. ride vehicles) requires that we close out the ongoing [peep discussion](https://github.com/OpenRCT2/OpenGraphics/issues/17).
- Track Sprites, the only way to render track sprites is using X7s track renderer, the accessibility of this tool is currently limited. Support for track rendering in the Blender RCT Graphics add-on would be ideal for consistency.
- GFX Asset Packs, whilst tested in 2022, the GFX asset pack implementation wasn't merged, and was limited to overwriting graphics from object files only.
- Flat Rides, each flat ride type has unique rendering code and thus needs its sprite to be cut up in unique ways. The Blender RCT Graphics add-on currently does not support this.

## Getting Started

For most object types the most accurate and quickest way to create sprites is using the [RCT Graphics Helper add-on for Blender 2.79](https://github.com/oli414/Blender-RCT-Graphics)

Blender Render last available in [Blender 2.79](https://www.blender.org/download/previous-versions/) is the most accurate render engine (for its time) that we have access to as an open source project.
You can use other software to create your models as well, as long as your main source file that you contribute to the project is a a Blender (.blend) file.

Scenery objects and stalls are currently the most accessible object type to create 3D models for. Check out [the spreadsheet](https://docs.google.com/spreadsheets/d/1ljVeYxp8ijj5z4VuSa6Xo1-_p3wACdQCRudkvkLGApc/edit#gid=1082671812) to see what has already been made. Just mark an object as WIP, and add your name to the author field.

## Requirements

- Only use [public domain textures](https://www.cgbookcase.com/textures).
- Save textures as JPG, and limit its size (1k should be plenty in most cases).
- Refrain from using premade models.
- Do not copy real life products (including rides). Look at how other games parody real life for inspiration, Planet Coaster is a good example of what is accepted.
- Objects need to maintain the same size and features as the RCT2 variants.

## Community

You can get in touch with us via the OpenRCT2 Discord server. There is a dedicated OpenGraphics channel that can be used to discuss this sub-project.

- Invitation link: https://discord.gg/uNzSmAj
- [![](https://img.shields.io/discord/264137540670324737?label=OpenRCT2%2Fgraphics)](https://discordapp.com/channels/264137540670324737/691752238057783356),

## License

**OpenGraphics** is licensed under the GNU General Public License version 3.
