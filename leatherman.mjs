import fetch from "node-fetch";

for (let i = 0; i < 700; i++) {
  const url = `https://www.leatherman.com/${i}.html`;
  const res = await fetch(url, { redirect: "manual" });
  if (res.status === 301) {
    console.log(i, res.headers.get("location"));
  } else {
    console.log(i);
  }
}
