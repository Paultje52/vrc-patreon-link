# VRC-Patreon-Link
> Automatically uploads a list of patrons to VRChat everytime a patron joins or leaves, without reuploading the world. For use with https://github.com/Miner28/AvatarImageReader

- Main
- [Encoder](./encoder/README.md)
- [Parser](./parser/README.md)

## How it works
The only way to update VRChat worlds without pushing a whole new update to them, is by collecting data from avatars.<br>
The [Encoder](./encoder/README.md) uploades an avatar to VRChat. All the VRChat usernames of the patrons are included in this avatar.<br>
The [Parser](./parser/README.md) reads the avatar and extracts the usernames so you can display them. Read the full technical details below.

An example of a world using this system is [Project Aincrad](https://vrchat.com/home/world/wrld_1caa6d80-9ee4-4a7d-95ee-50259272aa35)

### Technical details
> **Note:** You should have a setup that gives patrons a role in Discord. You can use different roles for different tiers and you can even add your Discord staff as separate roles for the synchronization!

When the encoder starts up or when a role in the server is changed, the encoder will go through everyone that has one of the configured roles. It will then check if everyone has linked a VRChat profile to the bot.<br>
If someone didn't link their VRChat profile to the bot yet, the bot will send the user a DM. To prevent Bot Quarantines, the bot will only open a new DM every 15 seconds. If the user doesn't have their DMs open, the bot will send a message in a configured channel instead. The user can then open their DMs and link their VRChat profile to the bot.<br>
While linking, the user can confirm the link and later remove the link and add a new one.

The encoder will check each five minutes if there are new links. If there are, it will encode everyone in an image and upload it to VRChat. The encoded text looks like this.
```
ROLE_NAME.FIRST_USERNAME.SECOND_USERNAME
SECOND_ROLE_NAME.THIRD_USERNAME.FOURTH_USERNAME
```
> **Note:** The order of the roles may shift. When the bot didn't find a user that linked their account on a role, the rol won't be included in the encoded text.

The text will be encoded in a PNG image with the size of `128x96`. The encoder will start each line at the right. The first part of the text is the length, after that the normal text follows. All the characters will be encoded in `utf16`.<br>
The data is saved in the color of each pixel. Each two bytes are a color value (Red, green or blue). An example (4x upscaled) avatar can be found below.<br>
![ExampleEncodedAvatar](https://media.discordapp.net/attachments/560382226592694282/929147650173984839/tmp.png)

The first time an avatar pedestal is loaded in the world, the thumbnail image will be downloaded. This gets cached locally. The image is copied from the pedestal once downloading finishes and captured with a camera, then output to a rendertexture. This rendertexture is decoded by AvatarImageReader, which outputs a string, which is then sent to the parser part of this project. The way caching works means that a user needs to restart their client in order to see the most up to date version.

## Setup
Please look at the [Encoder](./encoder/README.md) and [Parser](./parser/README.md) README for more information.

## License
The license for this whole project is **MIT** and can be found [here](LICENSE). The summary of the license is as follows.
- Do whatever you want with the project.
- We are not responsible for any damages caused by the use of this project.<br>
> Please test this system at least once in a (private) test Discord server + VRChat world to ensure everything has been set up correctly.
- The [LICENSE](LICENSE) file must be includes in all forks, including the current copyright notice. When changing anything, you can copyright the _changes_ by adding new lines to the [LICENSE](LICENSE) file.
