import fetch from "node-fetch";

const start = 695;
const end = start + 30;

for (let i = start; i < end; i++) {
  const url = `https://www.leatherman.com/${i}.html`;
  const res = await fetch(url, { redirect: "manual" });
  if (res.status === 301) {
    let location = res.headers.get("location");
    if (location.startsWith("/")) {
      location = "https://www.leatherman.com" + location;
    }
    console.log(i, location);
  } else {
    console.log(i);
  }
}
