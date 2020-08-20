const server = require("http").createServer();
const server = http.createServer();
const io = require("socket.io")(server);

io.on("connection", (client) => {
  console.log("connected with", client);
  client.on("event", (data) => {
    /* … */
  });
  client.on("disconnect", () => {
    /* … */
  });
});

server.listen(3000);
