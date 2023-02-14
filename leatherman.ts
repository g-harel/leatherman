import { join } from "https://deno.land/std@0.176.0/path/mod.ts";
import { printf } from "https://deno.land/std@0.176.0/fmt/printf.ts";

const outDir = "archive";
const maxID = 710;

// Iterates through all IDs and fetches final URL.
const fetchIDs = async (): Promise<Record<number, string>> => {
  const out: Record<number, string> = {};
  for (let i = 1; i < maxID; i++) {
    const url = `https://www.leatherman.com/${i}.html`;
    const res = await fetch(url, { redirect: "manual" });
    if (res.status === 301) {
      let location = res.headers.get("location");
      if (location && location.startsWith("/")) {
        location = "https://www.leatherman.com" + location;
      }
      out[i] = location || "";
    } else {
      out[i] = "";
    }
    printf(".");
    if (i % 100 === 0) printf(String(i));
  }
  console.log("Done");
  return out;
};

// Writes today's archive to a file and returns the path.
const writeToday = async (): Promise<string> => {
  // Fetch results and clean up data.
  const result = await fetchIDs();
  for (let i = maxID; i > 0; i--) {
    if (result[i] !== undefined && result[i] !== "") break;
    delete result[i];
  }

  // Print results.
  const stringResult = Object
    .entries(result)
    .map(([id, location]) => `${id.padStart(4, "0")} ${location}`.trim())
    .join("\n");

  // Write results to file.
  const date = new Date().toISOString().substring(0, 10);
  const path = join(".", outDir, date);
  await Deno.writeTextFile(path, stringResult + "\n");
  return path;
};

// Diffs two files and returns raw output.
const diff = async (pathA: string, pathB: string): Promise<string> => {
  const process = Deno.run({
    cmd: ["diff",  "-U", "0", pathA, pathB],
    stdout: "piped",
    stderr: "piped",
  });

  const status = await process.status();
  const output = new TextDecoder().decode(await process.output());
  if (status.code <= 1) return output;

  const errOutput = new TextDecoder().decode(await process.stderrOutput());
  throw "diff failed: " + errOutput;
};

// Retroactively add diffs for all archive files.
const writeDiffs = async () => {
  // Collect paths and sort by date.
  const paths = [];
  for await (const path of Deno.readDir(outDir)) {
    if (!path.isFile || path.name.endsWith(".diff")) continue;
    paths.push(join(outDir, path.name));
  }
  paths.sort();

  // Diff archive files.
  let prev: null | string = null;
  for (const currentPath of paths) {
    if (prev === null) {
      prev = currentPath;
      continue;
    }

    let result = await diff(prev, currentPath);
    result = result.replaceAll(/@@.*@@/g, "@@");
    result = result.replaceAll(/	\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, "");

    await Deno.writeTextFile(currentPath + ".diff", result);
    prev = currentPath;
  }
};

await writeToday();
await writeDiffs();
