import constants from "./constants";
import stringToByteArray from "./stringToByteArray";
import * as png from "fast-png";

export default function imageEncoder(text: string, avatarIds: string[]): Buffer[] {
  // Convert to UTF-8 array
  const byteArray = stringToByteArray(text);

  // Split byteArray into chunks. Each chunk is the max length of an image
  const amountOfChunks = byteArray.length % constants.maxBytesPerAvatar === 0 ? byteArray.length/constants.maxBytesPerAvatar : Math.floor(byteArray.length/constants.maxBytesPerAvatar)+1;
  const chunks: [Uint8Array, number][] = [];
  for (let i = 0; i < amountOfChunks; i++) {
    const chunkData = byteArray.slice(i*constants.maxBytesPerAvatar, (i+1)*constants.maxBytesPerAvatar);
    const chunk = new Uint8Array(chunkData.length % 4 === 0 ? chunkData.length : chunkData.length + (4-chunkData.length%4)).fill(16);
    chunk.set(chunkData);
    chunks.push([chunk, chunkData.length]);
  }

  // Loop over each chunk and create an image
  const images: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i][0];
    const chunkLength = chunks[i][1];

    // Array with all the data
    const data = new Uint8Array(constants.width * constants.height * 4).fill(255);

    // Function to add a rgba string
    let x = constants.width - 1;
    let y = 0;
    const addData = (r: number, g: number, b: number, a: number) => {
      const index = (y * constants.width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;

      x--;
      if (x < 0) {
        x = constants.width - 1;
        y++;
      }
    };

    // Header: Length of the data
    addData(chunkLength >> 24, chunkLength >> 16, chunkLength >> 8, chunkLength);
    // Header: Next avatar id (if needed)
    let nextAvatarId = avatarIds[i+1];
    if (!nextAvatarId || i === chunks.length-1) nextAvatarId = constants.emptyAvatarId;
    const nextAvatarPixels = nextAvatarId.replace(/-/g, "").replace(/avtr_/g, "").match(/.{1,8}/g);
    for (let i = 0; i < nextAvatarPixels.length; i++) {
      const pixel = nextAvatarPixels[i];
      addData(parseInt(pixel.substring(0, 2), 16), parseInt(pixel.substring(2, 4), 16), parseInt(pixel.substring(4, 6), 16), parseInt(pixel.substring(6, 8), 16));
    }
    // Header: Zero pixel (for backwards compatibility)
    addData(0, 0, 0, 0);
    // Header: Metadata (previously facebookdata - I mean oculusdata)
    addData(constants.dataMode, constants.majorVersion, constants.minorVersion, constants.encoderMode);

    // Calculate the length
    const length = chunk.length % 4 === 0 ? Math.floor(chunk.length/4) : Math.floor(chunk.length/4)+1;

    // Loop over each pixel
    for (let i = 0; i < length; i++) {
      addData(chunk[i*4], chunk[i*4+1], chunk[i*4+2], chunk[i*4+3]);
    }

    // Create the image
    const imageData = png.encode({
      data,
      height: constants.height,
      width: constants.width,
      depth: 8,
      channels: 4
    });

    // Create a buffer and add the image
    const buffer = Buffer.from(imageData);
    images.push(buffer);
  }

  return images;

}