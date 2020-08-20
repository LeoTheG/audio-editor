const server = require("http").createServer();
const io = require("socket.io")(server);
const port = process.env.PORT || 8000;

io.on("connection", (client) => {
  console.log("connected with", client);
  client.on("event", (data) => {
    /* … */
  });
  client.on("disconnect", () => {
    /* … */
  });
});

server.listen(port);
