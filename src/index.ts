import imageEncoder from "./imageEncoder/imageEncoder";
import { writeFileSync } from "fs";

let img = imageEncoder("Goodbye world (#Evil programmer)");
if (img !== null) writeFileSync("test.png", img);