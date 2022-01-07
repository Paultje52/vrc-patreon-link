import constants from "./constants";
import stringToByteArray from "./stringToByteArray";
import { createCanvas } from "canvas";
import byteArrayToHexadecimal from "./byteArrayToHexadecimal";

export default function imageEncoder(text: string) {
  // Convert to UTF 16 array
  let byteArray = stringToByteArray(text);

  // Convert the byteArray to hexadecimal string
  let hexString = byteArrayToHexadecimal(byteArray);

  // Split the hexString into six hexadecimal numbers (RGB)
  let hexParts = hexString.match(/.{1,6}/g);
  if (hexParts === null) return null;

  // Ensure the last pixel is filled in too.
  while (hexParts[hexParts.length - 1].length !== 6) {
    hexParts[hexParts.length - 1] += "10";
  }
  
  // Create the image
  let canvas = createCanvas(constants.width, constants.height);
  let ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, constants.width, constants.height);

  // Write length
  let hexLength = byteArray.length.toString(16);
  ctx.fillStyle = `#${"000000".substring(0, 6 - hexLength.length)}${hexLength}`;
  ctx.fillRect(constants.width-1, 0, 1, 1);

  // Draw the image
  let y = 0;
  let x = constants.width - 2;

  hexParts.forEach((hex) => {
    // Fill the pixel with the RGB color
    ctx.fillStyle = `#${hex}`;
    ctx.fillRect(x, y, 1, 1);

    // Remove 1 from X for the next 
    x--;

    // If the next X is less then 0, move to the next line
    if (x < 0) {
      x = constants.width-1;
      y++;
    }
    // If the next Y is greater then the height, cry
    if (y > constants.height) throw new Error("Text too large");
  });

  // Convert the image to a PNG buffer
  return canvas.toBuffer("image/png");


}