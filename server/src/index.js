const server = require("http").createServer();
const io = require("socket.io")(server);
const port = process.env.PORT || 8000;

const clientPositions = {};

// todo: emit client disconnects and room changes, should hide for former roommates

io.on("connection", (client) => {
  console.log("connected with", client);
  client.on("connect room", (id) => {
    // leave old rooms
    for (room in client.rooms) {
      if (client.id !== room) client.leave(room);
    }
    console.log("connecting to room ", id);
    client.join(id);
    /* … */
  });

  client.on("cursor move", (position) => {
    console.log("got position ", position);
    const { x, y } = position;
    clientPositions[client.id] = { x, y };

    const clientRoom = Object.keys(client.rooms).find(
      (room) => client.id !== room
    );

    client.to(clientRoom).emit("cursor move", client.id, [x, y]);
  });

  client.on("disconnect", () => {
    /* … */
  });
});

server.listen(port);
