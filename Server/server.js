const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2");
const CryptoJS = require("crypto-js");

const app = express();

app.use(cors());



const db = mysql.createConnection({

  host: "localhost",
  user: "root",
  password: "root2002",
  database: "chatapp",

});

db.connect((err) => {

  if (err) {

    console.log("MySQL Error:", err);

  } else {

    console.log("MySQL Connected ✅");

  }

});



const server = http.createServer(app);



const io = new Server(server, {

  cors: {

    origin: "http://localhost:3000",
    methods: ["GET", "POST"],

  },

});



io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);



  socket.on("send_message", (data) => {

    console.log("Original Message:", data);



    const encryptedText =
      CryptoJS.AES.encrypt(
        data.text,
        "secret123"
      ).toString();

    console.log(
      "Encrypted Message:",
      encryptedText
    );

    

    const sql =
      "INSERT INTO messages (username, ciphertext) VALUES (?, ?)";

    db.query(

      sql,

      [data.username, encryptedText],

      (err, result) => {

        if (err) {

          console.log(
            "MYSQL ERROR:",
            err.sqlMessage
          );

        } else {

          console.log(
            "Encrypted Message Saved ✅"
          );

        }

      }

    );

    

    io.emit(
      "receive_message",
      data
    );

  });



  socket.on("disconnect", () => {

    console.log("User Disconnected ❌");

  });

});



server.listen(3001, () => {

  console.log("Server Running 🚀");

});