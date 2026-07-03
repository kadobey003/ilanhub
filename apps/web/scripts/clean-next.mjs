import { rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".next");
if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true });
  console.log("Removed", dir);
}
