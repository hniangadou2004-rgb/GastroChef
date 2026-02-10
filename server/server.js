require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

require("./socket/game.socket")(io);

// Connexion DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes REST
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/lab", require("./routes/lab.routes"));
app.use("/api/ingredients", require("./routes/ingredient.routes"));
app.use("/api/save", require("./routes/save.routes"));
app.use("/api/economy", require("./routes/economy.routes"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Serveur HTTP + Socket.io lancé sur http://localhost:${PORT}`)
);
