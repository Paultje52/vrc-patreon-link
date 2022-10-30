// Function to convert a string to a byte array (With UTF-8 encoding)
export default function stringToByteArray(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}