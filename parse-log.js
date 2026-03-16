import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));

const logFilePattern = /^log(\d+)\.html$/;
const logFiles = readdirSync(__dirname)
  .filter((name) => logFilePattern.test(name))
  .sort((a, b) => {
    const nA = Number(a.match(logFilePattern)[1]);
    const nB = Number(b.match(logFilePattern)[1]);
    return nA - nB;
  });

function parseLogHtml(html) {
  const $ = cheerio.load(html);
  const rows = [];
  $("table tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length !== 4) return;

    const time = $(cells[0]).text().trim();
    const player = $(cells[1]).text().trim();
    const dkpChangeRaw = $(cells[2]).text().trim();
    const dkpChange = dkpChangeRaw === "" ? null : Number(dkpChangeRaw);
    const description = $(cells[3]).text().replace(/\s+/g, " ").trim();

    rows.push({
      time,
      player,
      dkpChange,
      description,
    });
  });
  return rows;
}

for (const fileName of logFiles) {
  const logPath = join(__dirname, fileName);
  const baseName = fileName.replace(/\.html$/, "");
  const outPath = join(__dirname, `${baseName}.json`);

  const html = readFileSync(logPath, "utf-8");
  const rows = parseLogHtml(html);
  const result = { entries: rows };
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Parsed ${rows.length} rows -> ${outPath}`);
}

if (logFiles.length === 0) {
  console.log("No log<number>.html files found.");
}
