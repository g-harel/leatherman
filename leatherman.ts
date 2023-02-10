import { join } from "https://deno.land/std@0.176.0/path/mod.ts";
import { printf } from "https://deno.land/std@0.176.0/fmt/printf.ts";

const outDir = "archive";

// Iterates through all IDs and fetches final URL.
const fetchIDs = async (start = 0, count = 1) => {
  let out = "";
  for (let i = start; i < start + count; i++) {
    const url = `https://www.leatherman.com/${i}.html`;
    const res = await fetch(url, { redirect: "manual" });
    if (res.status === 301) {
      let location = res.headers.get("location");
      if (location && location.startsWith("/")) {
        location = "https://www.leatherman.com" + location;
      }
      out += `${i} ${location}\n`;
    } else {
      out += `${i}\n`;
    }
    printf(".");
  }
  console.log("Done");
  return out;
};

// Writes today's archive to a file and returns the path.
const writeToday = async (): Promise<string> => {
  const date = new Date().toISOString().substring(0, 10);
  const path = join(".", outDir, date);
  await Deno.writeTextFile(path, await fetchIDs(0, 710));
  return path;
};

// Gets the path of the most recent archive.
const getLatestPath = async (): Promise<string> => {
  let latest = "1983-07-01";
  for await (const path of Deno.readDir(outDir)) {
    if (
      path.isFile && !path.name.endsWith(".diff") &&
      path.name.localeCompare(latest) > 0
    ) {
      latest = path.name;
    }
  }
  return join(".", outDir, latest);
};

// Diffs two files.
const diff = async (pathA: string, pathB: string): Promise<string> => {
  const process = Deno.run({
    cmd: ["diff", "-u", pathA, pathB],
    stdout: "piped",
    stderr: "piped",
  });

  const status = await process.status();
  const output = new TextDecoder().decode(await process.output());
  if (status.code <= 1) return output;

  const errOutput = new TextDecoder().decode(await process.stderrOutput());
  throw "diff failed: " + errOutput;
};

const latestPath = await getLatestPath();
const noPrevious = latestPath < "2000-01-01";

const todayPath = await writeToday();
if (todayPath === latestPath) {
  console.log("Already ran today.");
  Deno.exit(1);
}

if (noPrevious) {
  console.log("Nothing to diff.");
  Deno.exit();
}

const diffResult = await diff(latestPath, todayPath);
if (diffResult.trim() === "") {
  console.log("No changes.");
  Deno.exit();
}

await Deno.writeTextFile(todayPath + ".diff", diffResult);
