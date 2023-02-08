import { join } from "https://deno.land/std@0.176.0/path/mod.ts";
import { copy } from "https://deno.land/std@0.104.0/io/util.ts";
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
  return out;
};

// Writes today's archive to a file and returns the path.
const writeToday = async (): Promise<string> => {
  const date = new Date().toISOString().substring(0, 10);
  const path = join(".", outDir, date);
  await Deno.writeTextFile(path, await fetchIDs(685, 20));
  return path;
};

// Gets the path of the most recent archive.
const getLatestPath = async (): Promise<string> => {
  let latest = "1983-07-01";
  for await (const path of Deno.readDir(outDir)) {
    if (path.isFile && path.name.localeCompare(latest) > 0) {
      latest = path.name;
    }
  }
  return join(".", outDir, latest);
};

//
const diff = async (pathA: string, pathB: string): Promise<string> => {
  const cmd = ["diff", "-u", pathA, pathB];
  const process = Deno.run({ cmd, stdout: "piped", stderr: "piped" });

  const output = new TextDecoder().decode(await process.output());
  const status = await process.status();
  
  if (status.success) return output;

  copy(process.stderr, Deno.stderr);
  throw "diff failed: ";
};

console.log(await diff(await getLatestPath(), await writeToday()));
