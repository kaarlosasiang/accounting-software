import fs from "fs";
import path from "path";

import dotenv from "dotenv";

const envFiles = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false });
  }
}

export default dotenv;
