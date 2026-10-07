import { readFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const rootPackage = await readJson(new URL("../package.json", import.meta.url));
const designTokenPackage = await readJson(
  new URL("../packages/design-tokens/package.json", import.meta.url),
);
const expectedTag = `v${rootPackage.version}`;

if (process.env.RELEASE_TAG !== expectedTag) {
  throw new Error(`Release tag ${process.env.RELEASE_TAG} does not match ${expectedTag}.`);
}

if (designTokenPackage.version !== rootPackage.version) {
  throw new Error(
    `Package version ${designTokenPackage.version} does not match application version ${rootPackage.version}.`,
  );
}

console.log(`Verified release ${expectedTag} and package versions.`);
