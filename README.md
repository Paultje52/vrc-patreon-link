# VRC-Patreon-Link
> Automatically manages and handles Discord role / VRChat integration. Commonly used to dynamically display patrons inside a world.

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

## Setup
Please look at the [Encoder](./encoder/README.md) and [Parser](./parser/README.md) README for more information.

## License
The license for this whole project is **MIT** and can be found [here](LICENSE). The summary of the license is as follows.
- Do whatever you want with the project.
- We are not responsible for any damages caused by the use of this project.