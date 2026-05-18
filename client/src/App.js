import "./App.css";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import CryptoJS from "crypto-js";

const socket = io(
  "https://real-time-chat-application-3m3d.onrender.com"
);

const SECRET_KEY = "secret123";

function App() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {

    socket.off("receive_message");

    socket.on("receive_message", (data) => {

      try {

        if (!data || !data.text) return;

        const bytes = CryptoJS.AES.decrypt(
          data.text,
          SECRET_KEY
        );

        const decryptedText =
          bytes.toString(CryptoJS.enc.Utf8) || data.text;

        const decryptedMessage = {

          ...data,
          text: decryptedText,

        };

        setChat((prev) => [

          ...prev,
          decryptedMessage,

        ]);

      } catch (error) {

        console.log(
          "❌ Decrypt Error:",
          error.message
        );

      }

    });

    return () => {

      socket.off("receive_message");

    };

  }, []);

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({

      behavior: "smooth",

    });

  }, [chat]);

  const sendMessage = () => {

    if (message.trim() !== "") {

      const messageData = {

        username: socket.id,
        text: message,

      };

      socket.emit(
        "send_message",
        messageData
      );

      setMessage("");

    }

  };

  return (

    <div className="app-container">

      <div className="chat-card">

        <div className="chat-header">

          <h1>Realtime Chat</h1>

          <p>End-to-End Encrypted Chat</p>

        </div>

        <div className="chat-body">

          {chat.map((msg, index) => (

            <div
              key={index}
              className={
                msg.username === socket.id
                  ? "message-right"
                  : "message-left"
              }
            >

              <strong>

                {msg.username === socket.id
                  ? "You"
                  : msg.username}

              </strong>

              <p>{msg.text}</p>

            </div>

          ))}

          <div ref={chatEndRef}></div>

        </div>

        <div className="chat-footer">

          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {

              if (e.key === "Enter") {

                sendMessage();

              }

            }}
          />

          <button onClick={sendMessage}>

            Send

          </button>

        </div>

      </div>

    </div>

  );

}

export default App;