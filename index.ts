import { readFileSync, readdirSync } from "fs";
import { join } from "path";

import parsePolicy from "./parser";
import isReachable from "./analyzer";

// Find all the possible valid files
const files = readdirSync(join(__dirname, "/policies"))
  .filter(file => file.startsWith("policy") && file.endsWith(".arbac"))
  .map(file => join(__dirname, "policies/" + file));

// Read all the files content
const readtFiles = files.map(file => ({
  name: file,
  content: readFileSync(file, "utf8")
}));

// Parses all the file
const parsedFiles = readtFiles.map(({ name, content }) => {
  try {
    return parsePolicy(content);
  } catch (e) {
    console.error("Cannot parse " + name + "!");
    throw e;
  }
});

// Change the index to choose the file to analyze:
const toParse = parsedFiles[3];

// Logs if it's reachable or not
console.log(isReachable(toParse) ? "REACHABLE!" : "NOT REACHABLE");
