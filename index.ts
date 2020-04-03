import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import parsePolicy from "./parser";
import isReachable from "./analyzer";

// const files = readdirSync(join(__dirname, "/policies"))
//   .filter((file) => file.endsWith(".arbac"))
//   .map((file) => join(__dirname, "policies/" + file));

const files = ["policies/example.arbac"];

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

console.log(JSON.stringify(parsedFiles[0], null, 2));

console.log(isReachable(parsedFiles[0]));
