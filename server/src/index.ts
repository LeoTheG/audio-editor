const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 8000;
import { resolve } from "path";

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(express.static(resolve(__dirname, "..", "build")));

app.get("*", (req, res) => {
  res.sendFile(resolve(__dirname, "..", "build", "index.html"));
});

app.listen(port, () => {
  console.log("Listening on port ", port);
});
