import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";

const fetchIDs = async (start = 0, count = 1) => {
  let out = "";
  for (let i = start; i < start + count; i++) {
    const url = `https://www.leatherman.com/${i}.html`;
    const res = await fetch(url, { redirect: "manual" });
    if (res.status === 301) {
      let location = res.headers.get("location");
      if (location.startsWith("/")) {
        location = "https://www.leatherman.com" + location;
      }
      out += `${i} ${location}\n`;
    } else {
      out += `${i}\n`;
    }
    process.stdout.write(".");
  }
  return out;
}

const date = new Date().toISOString().substring(0, 10);
fs.writeFile(path.join(".", "archive", date), await fetchIDs(685, 20));
