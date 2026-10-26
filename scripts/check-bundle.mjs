import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_BYTES = 350 * 1024;
const assetsDir = join(process.cwd(), "dist", "assets");

if (!existsSync(assetsDir)) {
  console.error("Bundle check failed: dist/assets does not exist. Run the build first.");
  process.exit(1);
}

const files = readdirSync(assetsDir)
  .filter((file) => file.endsWith(".js"))
  .sort();

if (files.length === 0) {
  console.error("Bundle check failed: no JavaScript assets found.");
  process.exit(1);
}

let totalRaw = 0;
let totalGzip = 0;

for (const file of files) {
  const raw = readFileSync(join(assetsDir, file));
  const gzip = gzipSync(raw, { level: 9 });
  totalRaw += raw.byteLength;
  totalGzip += gzip.byteLength;
  console.log(
    `${file.padEnd(38)} ${formatKb(raw.byteLength).padStart(10)} raw ${formatKb(gzip.byteLength).padStart(10)} gzip`,
  );
}

console.log("");
console.log(
  `Initial JS: ${formatKb(totalGzip)} gzipped of ${formatKb(BUDGET_BYTES)} budget (${formatKb(totalRaw)} raw)`,
);

if (totalGzip > BUDGET_BYTES) {
  console.error(
    `Bundle check failed: ${formatKb(totalGzip)} exceeds the ${formatKb(BUDGET_BYTES)} gzipped budget.`,
  );
  process.exit(1);
}

console.log("Bundle check passed.");

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
