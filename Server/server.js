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

/* =========================
   MYSQL CONNECTION
========================= */

const db = mysql.createConnection({

  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

  ssl: {
    rejectUnauthorized: false,
  },

});

db.connect((err) => {

  if (err) {

    console.log("❌ MySQL Error:", err.message);

  } else {

    console.log("✅ MySQL Connected");

  }

});

/* =========================
   SERVER
========================= */

const server = http.createServer(app);

/* =========================
   SOCKET.IO
========================= */

const io = new Server(server, {

  cors: {

    origin:
      "https://real-time-chat-application-ten-lovat.vercel.app",

    methods: ["GET", "POST"],

  },

});

io.on("connection", (socket) => {

  console.log("🟢 User Connected:", socket.id);

  /* =========================
     SEND MESSAGE
  ========================= */

  socket.on("send_message", (data) => {

    try {

      console.log("📩 Incoming Data:", data);

      if (!data || !data.text) {

        console.log("❌ Empty Message");
        return;

      }

      if (!SECRET_KEY) {

        console.log("❌ SECRET_KEY Missing");
        return;

      }

      /* =========================
         ENCRYPT MESSAGE
      ========================= */

      const encryptedText =
        CryptoJS.AES.encrypt(
          data.text,
          SECRET_KEY
        ).toString();

      console.log("🔐 Encrypted:", encryptedText);

      /* =========================
         SAVE TO MYSQL
      ========================= */

      const sql =
        "INSERT INTO messages (username, ciphertext) VALUES (?, ?)";

      db.query(
        sql,
        [data.username, encryptedText],
        (err, result) => {

          if (err) {

            console.log(
              "❌ MYSQL ERROR:",
              err.message
            );

          } else {

            console.log("💾 Message Saved");
            console.log(result);

          }

        }
      );

      /* =========================
         SEND TO ALL USERS
      ========================= */

      io.emit("receive_message", {

        username: data.username,
        text: encryptedText,

      });

    } catch (error) {

      console.log(
        "❌ SERVER ERROR:",
        error.message
      );

    }

  });

  /* =========================
     DISCONNECT
  ========================= */

  socket.on("disconnect", () => {

    console.log(
      "🔴 User Disconnected:",
      socket.id
    );

  });

});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {

  console.log(
    `🚀 Server Running on port ${PORT}`
  );

});