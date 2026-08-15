const fs = require("fs");
const path = require("path");

const locks = [
  path.join(process.cwd(), ".next", "dev", "lock"),
  path.join(process.cwd(), ".next", "lock"),
];

for (const lock of locks) {
  try {
    fs.rmSync(lock, { force: true });
  } catch {
    // ignore
  }
}
