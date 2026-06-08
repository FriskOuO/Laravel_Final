import { copyFile, rm } from "node:fs/promises";
import { join } from "node:path";

const outDir = "dist-mobile";
const mobileHtml = join(outDir, "index.mobile.html");
const androidHtml = join(outDir, "index.html");

await copyFile(mobileHtml, androidHtml);
await rm(mobileHtml, { force: true });
