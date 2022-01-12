# VRC-Patreon-Link
> Automatically uploads a list of patrons to VRChat everytime a patron joins or leaves, without reuploading the world. For use with https://github.com/Miner28/AvatarImageReader

- Main
- [Encoder](./encoder/README.md)
- [Parser](./parser/README.md)

## Like this project?
Give us a star on [GitHub](https://github.com/Paultje52/vrc-patreon-link) and join our [Discord](https://discord.gg/n4VPPnX2Mb)!
## How it works
This project makes use of [AvatarImageReader](https://github.com/miner28/AvatarImageReader) to fetch new data in a VRChat world at runtime.<br>
The [Encoder](./encoder/README.md) is a Discord bot which automatically asks Patrons for their VRChat profile URLs, which it turns into a list of usernames. These are then encoded into an avatar thumbnail image, which is uploaded to VRChat.<br>
The [Parser](./parser/README.md) reads the output of AvatarImageReader and extracts the usernames so you can display them and check if the local player has a certain Patreon tier. Read the full technical details below.

An example of a world using this system is [Project Aincrad](https://vrchat.com/home/world/wrld_1caa6d80-9ee4-4a7d-95ee-50259272aa35).

### Technical details
> **Note:** You should have a setup that gives patrons a role in Discord. A simple way to get this to work is by giving Patrons Discord rewards using the Patreon Discord bot. You can use different roles for different tiers and you can even add your Discord staff as separate roles for the synchronization! Any selected role can be checked for or displayed at runtime (in VRChat).

When the encoder starts up or when a role in the server is changed, the encoder will go through everyone that has one of the configured roles. It will then check if everyone has linked a VRChat profile to the bot.<br>
If someone didn't link their VRChat profile to the bot yet, the bot will send the user a DM. To prevent Bot Quarantines, the bot will only open a new DM every 15 seconds. If the user doesn't have their DMs open, the bot will send a message in a configured channel instead. The user can then open their DMs and link their VRChat profile to the bot.<br>
While linking, the user can confirm the link and later remove the link and add a new one.

The encoder will check for new links once every five minutes. If there are, it will encode a new image and upload it to VRChat. The encoded text looks like this.
```
ROLE_NAME.FIRST_USERNAME.SECOND_USERNAME
SECOND_ROLE_NAME.THIRD_USERNAME.FOURTH_USERNAME
```
Text is converted to binary data with UTF16 encoding. 3 bytes of data are encoded into every pixel, giving us a total of 38861 Bytes to work with (the first pixel encodes data length). An example (4x upscaled to prevent bilinear filtering from messing it up) image can be found below.<br>
![ExampleEncodedAvatar](https://media.discordapp.net/attachments/560382226592694282/929147650173984839/tmp.png)

The first time an avatar pedestal is loaded in the client, the thumbnail image will be downloaded. This gets cached locally. The image is copied from the pedestal once downloading finishes and captured with a camera, then output to a rendertexture. This rendertexture is decoded by AvatarImageReader, which outputs a string, which is then sent to the parser part of this project. The way caching works means that a user needs to restart their client in order to see the most up to date version.

## Setup
Please look at the [Encoder](./encoder/README.md) and [Parser](./parser/README.md) README for more information.

## License
The license for this whole project is **MIT** and can be found [here](LICENSE). The summary of the license is as follows.
- Do whatever you want with the project.
- We are not responsible for any damages caused by the use of this project.<br>
> Please test this system at least once in a (private) test Discord server + VRChat world to ensure everything has been set up correctly.
- The [LICENSE](LICENSE) file must be includes in all forks, including the current copyright notice. When changing anything, you can copyright the _changes_ by adding new lines to the [LICENSE](LICENSE) file.
