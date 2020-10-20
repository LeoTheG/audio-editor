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

// { [roomId: string]: number }
const roomPlaytimes = {};

// { [roomId: string]: number }
const lastPausedLobby = {};

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
    createProfile(client);
  }

  client.on("connect room", (roomId) => {
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

    // // leave old rooms
    // for (room in client.rooms) {
    //   if (client.id !== room && roomId !== room) {
    //     client.to(room).emit("roommate disconnect", client.id);
    //     client.leave(room);

    //     if (roomToClientProfiles[room][client.id]) {
    //       delete roomToClientProfiles[room][client.id];
    //     }
    //   }
    // }
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

  client.on("cursor move", (data) => {
    const { x, y, points } = data;
    clientPositions[client.id] = { x, y };

    const clientRoom = getClientRoom(client);
    if (!clientRoom) return;

    client.to(clientRoom).emit("cursor move", client.id, [x, y], points);
  });

  client.on("submit bullet", (text) => {
    const clientRoom = getClientRoom(client);
    if (!clientRoom) return;
    client.to(clientRoom).emit("receive bullet", text);
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
    delete selectedProfiles[client.id];
  });

  client.on("lobby playtime set", (roomId, playTime) => {
    roomPlaytimes[roomId] = playTime;

    if (
      !lastPausedLobby[roomId] ||
      Date.now() - lastPausedLobby[roomId] > 3000
    ) {
      client.to(roomId).emit("lobby play");
    }
  });

  client.on("lobby playtime", (roomId) => {
    client.emit(
      "lobby playtime",
      roomPlaytimes[roomId],
      roomToClientProfiles[roomId]
    );
  });

  client.on("lobby play", (roomId) => {
    if (!roomId) return;

    client.to(roomId).emit("lobby play");
  });

  client.on("lobby pause", (roomId) => {
    lastPausedLobby[roomId] = Date.now();
    client.to(roomId).emit("lobby pause");
  });
});

server.listen(port, () => {
  console.log("server listening on port", port);
});

const getClientRoom = (client) => {
  return Object.keys(client.rooms).find((room) => client.id !== room);
};

const createProfile = (client) => {
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
};
