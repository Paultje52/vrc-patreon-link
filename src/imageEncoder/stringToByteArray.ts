// Function to convert a string to a byte array (With UTF-16 encoding)
export default function stringToByteArray(text: string): Uint8Array {
  let buf = new ArrayBuffer(text.length * 2);
  let bufView = new Uint16Array(buf);

  for (let i = 0; i < text.length; i++) {
    bufView[i] = text.charCodeAt(i);
  }

  return new Uint8Array(buf);
}