import {join} from "https://deno.land/std@0.176.0/path/mod.ts";
import {printf} from "https://deno.land/std@0.176.0/fmt/printf.ts";

const outDir = "archive";

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

const date = new Date().toISOString().substring(0, 10);
Deno.writeTextFile(join(".", outDir, date), await fetchIDs(685, 20));
