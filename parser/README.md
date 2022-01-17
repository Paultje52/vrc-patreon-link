# VRC-Patreon-Link Parser
> Automatically uploads a list of patrons to VRChat everytime a patron joins or leaves, without reuploading the world. For use with https://github.com/Miner28/AvatarImageReader

- [Main](../README.md)
- [Encoder](../encoder/README.md)
- Parser

## Parser
The parser is the system that connects to AvatarImageReader to turn the output of the encoder into easily useable text. Requires the latest version of [UdonSharp](https://github.com/MerlinVR/UdonSharp) and [AvatarImageReader](https://github.com/Miner28/AvatarImageReader)

## Setup
1. Import the latest version of [AvatarImageReader](https://github.com/Miner28/AvatarImageReader) into your project
2. Create a new AvatarImageReader prefab using the menu item `Tools/AvatarImageReader/Create Image Reader`
3. Open the inspector for the generated Decoder gameobject and click Set Avatar, then select the desired avatar to be used. This can just be an empty avatar descriptor uploaded using the avatar SDK. It doesn't matter what platforms the avatar has been uploaded for. You can use Enter ID to manually paste in the blueprint ID.
4. Enable Link with Patreon Decoder in the inspector
5. Either import the UnityPackage for the Parser into your project or add the script manually, then add it to a new GameObject.
6. Reference the Decoder behaviour from the Parser and vice versa.
7. Enter the names for the roles you want to parse, and optionally set up TextMeshPro references to print lists of patrons to.

![inspector](https://user-images.githubusercontent.com/24632962/149590785-aef83a29-9f83-407f-bbf7-89a4bf13cf9c.png)

## Usage
Before using any of these functions you should check if `decodeFinished` is set to true. You can also set up a callback behaviour to run checks once decoding has finished.
PatreonDecoder lives in the namespace `BocuD.PatreonParser`.

`bool _LocalPlayerHasRole(string targetRole)`: returns true if the local player has the specified role.

`string[] _GetPatronsByString(string targetRole)`: returns a string array of display names that have the specified role.

`string[] _GetPatronsFromID(int roleID)`: returns a string array of display names for the specified role ID (the index of the role in the inspector)
