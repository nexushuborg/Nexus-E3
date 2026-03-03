const { Server } = require("socket.io");
const { socketHandler } = require("../controllers/socketController");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  socketHandler(io);
}

module.exports = { initSocket };
