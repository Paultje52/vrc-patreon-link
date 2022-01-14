const imageEncoder = require("../build/imageEncoder/imageEncoder.js").default;
const fs = require("fs/promises");
const path = require("path");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

let testString = "Goodbye World!";

beforeAll(() => {
  expect.extend({ toMatchImageSnapshot });
});

test("Image Encoder", async () => {
  let encoded = imageEncoder(testString);

  expect(encoded).toMatchImageSnapshot();
});