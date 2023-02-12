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
  await Deno.writeTextFile(path, await fetchIDs(0, 710) + "\n");
  return path;
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

    const result = await diff(prev, currentPath);
    await Deno.writeTextFile(currentPath + ".diff", result);
    prev = currentPath;
  }
};

await writeToday();
await writeDiffs();
