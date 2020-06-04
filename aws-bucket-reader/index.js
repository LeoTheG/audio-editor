const fs = require("fs");

function makeUrl(key) {
  let url = "https://audio-player-clips.s3-us-west-1.amazonaws.com/" + key;
  while (url.indexOf(" ") !== -1) {
    url = url.replace(" ", "+");
  }
  return url;
}

fs.readFile("./in", "utf8", function (err, data) {
  songArr = JSON.parse(data).Contents.map((songData) => ({
    key: songData.Key,
    url: makeUrl(songData.Key),
  }));
  fs.writeFileSync("./out.txt", JSON.stringify(songArr, null, 2));
});
