// const server = require('http').createServer();
import http from "http";
import socketIO from "socket.io";

const server = http.createServer();
const io = socketIO(server);

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
