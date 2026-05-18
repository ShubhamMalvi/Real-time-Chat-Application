require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2");
const CryptoJS = require("crypto-js");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET_KEY = "secret123";

const db = mysql.createConnection({

  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

});

db.connect((err) => {

  if (err) {

    console.log("❌ MySQL Error:", err.message);

  } else {

    console.log("✅ MySQL Connected");

  }

});

const server = http.createServer(app);

const io = new Server(server, {

  cors: {

    origin: "https://real-time-chat-application-ten-lovat.vercel.app",
    methods: ["GET", "POST"],

  },

});

io.on("connection", (socket) => {

  console.log("🟢 User Connected:", socket.id);

  socket.on("send_message", (data) => {

    try {

      if (!data || !data.text) return;

      const encryptedText =
        CryptoJS.AES.encrypt(
          data.text,
          SECRET_KEY
        ).toString();

      const sql =
        "INSERT INTO messages (username, ciphertext) VALUES (?, ?)";

      db.query(
        sql,
        [data.username, encryptedText],
        (err) => {

          if (err) {

            console.log(
              "❌ MYSQL ERROR:",
              err.message
            );

          } else {

            console.log("💾 Message Saved");

          }

        }
      );

      io.emit("receive_message", {

        username: data.username,
        text: encryptedText,

      });

    } catch (error) {

      console.log(
        "❌ Server Error:",
        error.message
      );

    }

  });

  socket.on("disconnect", () => {

    console.log(
      "🔴 User Disconnected:",
      socket.id
    );

  });

});

server.listen(3001, () => {

  console.log(
    "🚀 Server Running on port 3001"
  );

});