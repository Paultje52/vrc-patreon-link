// Function to convert a decimal array to a hexadecimal string
export default function byteArrayToHexadecimal(byteArray: Uint8Array): string {
  let hexString = "";

  for (let i = 0; i < byteArray.length; i++) {
    let hex = byteArray[i].toString(16);
    if (hex.length === 1) hex = `0${hex}`;
    hexString += hex;
  }

  return hexString;
}