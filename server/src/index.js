const server = require("http").createServer();
const io = require("socket.io")(server);
const port = process.env.PORT || 8000;

const clientPositions = {};

// {[clientId: string]: string}
const clientRooms = {};
const roomToClientProfiles = {};
const clientProfiles = {};

// { [clientId: string]: string }
const selectedProfiles = {};

// { [clientId: string]: string }
const userNames = {};

const profileOptions = {
  prefixes: [
    "amazing",
    "deranged",
    "charming",
    "dapper",
    "eager",
    "defiant",
    "spotted",
    "rare",
  ],
  suffixes: [
    "woodpecker",
    "mallard",
    "grasshopper",
    "boar",
    "snail",
    "coyote",
    "meerkat",
    "narwhal",
    "scorpion",
  ],
  avatars: ["kirby", "link", "mario", "nyancat", "ghost", "yoshi"],
};

io.on("connection", (client) => {
  if (!clientProfiles[client.id]) {
    userNames[client.id] =
      profileOptions.prefixes[
        Math.floor(Math.random() * profileOptions.prefixes.length)
      ] +
      " " +
      profileOptions.suffixes[
        Math.floor(Math.random() * profileOptions.suffixes.length)
      ];

    const selectedProfilesValues = Object.values(selectedProfiles);

    let newAvatar = "";

    // basic attempt to prevent duplicate sprites, not checking for different rooms
    if (selectedProfilesValues.length >= profileOptions.avatars.length) {
      newAvatar =
        profileOptions.avatars[
          Math.floor(Math.random() * profileOptions.avatars.length)
        ];
    } else {
      const availableAvatars = profileOptions.avatars.filter(
        (avatar) => !selectedProfilesValues.includes(avatar)
      );
      newAvatar =
        availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
    }

    selectedProfiles[client.id] = newAvatar;

    clientProfiles[client.id] = {
      name: userNames[client.id],
      avatar: newAvatar,
    };
  }

  client.on("connect room", (roomId) => {
    console.log("client " + client.id + " ===connected to room===" + roomId);
    client.join(roomId);
    if (
      clientRooms[client.id] &&
      roomToClientProfiles[clientRooms[client.id]][client.id]
    ) {
      delete roomToClientProfiles[clientRooms[client.id]][client.id];
    }
    clientRooms[client.id] = roomId;

    if (!roomToClientProfiles[roomId]) {
      roomToClientProfiles[roomId] = {};
    }
    const roomProfiles = { ...roomToClientProfiles[roomId] };

    roomToClientProfiles[roomId][client.id] = clientProfiles[client.id];

    console.log(
      "room to client profiles for room ",
      roomId,
      " are ",
      roomToClientProfiles[roomId]
    );

    // leave old rooms
    for (room in client.rooms) {
      if (client.id !== room && roomId !== room) {
        client.to(room).emit("roommate disconnect", client.id);
        client.leave(room);

        if (roomToClientProfiles[room][client.id]) {
          console.log(
            "deleted old room profile for room and id",
            room,
            client.id
          );
          delete roomToClientProfiles[room][client.id];
        }
      }
    }
    client
      .to(roomId)
      .emit("profile info", client.id, clientProfiles[client.id]);
    client.emit("room profile info", roomProfiles);
  });

  client.on("disconnect room", () => {
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

    console.log("emitting cursor move for client and x y ", client.id, x, y);
    client.to(clientRoom).emit("cursor move", client.id, [x, y]);
  });

  client.on("disconnect", () => {
    const clientRoom = clientRooms[client.id];

    if (!clientRoom) return;

    client.leave(clientRoom);
    client.to(clientRoom).emit("roommate disconnect", client.id);
    if (clientRooms[client.id]) {
      delete roomToClientProfiles[clientRooms[client.id]][client.id];
      delete clientRooms[client.id];
    }
    delete clientProfiles[client.id];
  });
});

server.listen(port);

const getClientRoom = (client) => {
  return Object.keys(client.rooms).find((room) => client.id !== room);
};
