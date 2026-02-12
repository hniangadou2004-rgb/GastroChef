require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

require("./socket/game.socket")(io);

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/lab", require("./routes/lab.routes"));
app.use("/api/ingredients", require("./routes/ingredient.routes"));
app.use("/api/save", require("./routes/save.routes"));
app.use("/api/economy", require("./routes/economy.routes"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`HTTP + Socket server started on http://localhost:${PORT}`);
});
