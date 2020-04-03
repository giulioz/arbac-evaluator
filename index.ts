import { readFileSync, readdirSync } from "fs";
import parsePolicy from "./parser";

const files = readdirSync(__dirname).filter((file) => file.endsWith(".arbac"));

const readtFiles = files.map((file) => ({
  name: file,
  content: readFileSync(file, "utf8"),
}));
const parsedFiles = readtFiles.map(({ name, content }) => {
  try {
    return parsePolicy(content);
  } catch (e) {
    console.error("Cannot parse " + name + "!");
    throw e;
  }
});

console.log(JSON.stringify(parsedFiles, null, 2));
