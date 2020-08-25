const server = require("http").createServer();
const io = require("socket.io")(server);
const port = process.env.PORT || 8000;

const clientPositions = {};
// {[clientId: string]: string}
const clientRooms = {};

// todo: emit client disconnects and room changes, should hide for former roommates

io.on("connection", (client) => {
  client.on("connect room", (id) => {
    console.log("connecting to room ", id);

    client.join(id);
    clientRooms[client.id] = id;
    // leave old rooms
    for (room in client.rooms) {
      if (client.id !== room && id !== room) {
        client.to(room).emit("roommate disconnect", client.id);
        client.leave(room);
      }
    }
    /* … */
  });

  client.on("disconnect room", () => {
    // for (room in client.rooms) {
    //     client.to(room).emit("roommate disconnect", client.id);
    //     client.leave(room);
    // }
    const clientRoom = getClientRoom(client);
    client.leave(clientRoom);
    client.to(clientRoom).emit("roommate disconnect", client.id);
    delete clientRooms[client.id];
  });

  client.on("cursor move", (position) => {
    const { x, y } = position;
    clientPositions[client.id] = { x, y };

    const clientRoom = getClientRoom(client);
    if (!clientRoom) return;

    client.to(clientRoom).emit("cursor move", client.id, [x, y]);
  });

  client.on("disconnect", () => {
    /* … */
    console.log("disconnected client", client.id);
    const clientRoom = clientRooms[client.id];

    if (!clientRoom) return;

    client.leave(clientRoom);
    client.to(clientRoom).emit("roommate disconnect", client.id);
  });
});

server.listen(port);

const getClientRoom = (client) => {
  return Object.keys(client.rooms).find((room) => client.id !== room);
};
