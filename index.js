import express, { json, response } from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import Wuz from "./core/wuz.js";

const app = express();
const port = 3000;
const clients = [];

const wuz = new Wuz();

app.use(express.json());

app.post("/api/message", async function (req, res) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  wuz.queue(message);

  res.json({ success: true, message: "Message queued" });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");

  clients.push(ws);

  wuz.on("processed", (payload) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload.message.content);
    }
  });

  ws.on("message", (message) => {
    try {
        const data = JSON.parse(message);
        console.log("Received JSON data:", data);

        ws.send(JSON.stringify({message: 'Data received'}));
    } catch (error) {
        console.error('Error parsing JSON', error);
    }

  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`);
});
