import express, { json, response } from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import Wuz from "./core/wuz.js";
import { v4 as uuidv4 } from "uuid";
import Client from "./core/client.js";

const app = express();
const port = 3000;
const clients = [];

const wuz = new Wuz();

wuz.on('processed', (payload) => {
  console.log(payload);
})

const get_id = (ws, message_data) => {
  const client = clients.find((c) => c.socket === ws);
  ws.send(JSON.stringify({action: 'client_id', id: client.id}));
}

const set_name = (ws, message_data) => {
  const client = clients.find((c) => c.socket === ws);
  client.setName(message_data.name);
  ws.send(JSON.stringify({action: 'client_update', message: `name updated to: ${client.name}`}));
}

const add_intent = (ws, message_data) => {
  const client = clients.find((c) => c.socket === ws);
  client.addIntent(message_data.key, message_data.value, message_data.description);
  ws.send(JSON.stringify({action: 'client_update', message: `intend added updated to ${client.name}: key=${message_data.key}, value=${message_data.value}, description=${message_data.description} `}));
}

const webSocketActions = {'get_id': get_id, 'set_name': set_name, 'add_intent': add_intent}

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

  const client = new Client(ws, uuidv4());
  clients.push(client);
  wuz.addClient(client);

  wuz.on("processed", (payload) => {
    const data_string = payload.message.content;
    console.log(data_string);
    const data = JSON.parse(data_string);
    const id = clients.find(c => c.socket === ws).id;
    if (ws.readyState === WebSocket.OPEN) {
    
      if(data.is_command_response && data.application_id == id || client.name == "speaker")
        ws.send(JSON.stringify({action: 'client_command', payload: data_string}));
      else
        ws.send(JSON.stringify({action: 'output', payload: data_string}));
    }
  });

  ws.on("message", (message) => {
    try {
        const data = JSON.parse(message);
        webSocketActions[data.action](ws, data);        
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

/**
 * Define a client connection.
 * Client -> Server
 *  {
 *    "action": "connected",
 *    "intents": intents
 *  }
 * 
 * Server -> Client
 *  {
 *    "action": "client_id_created"
 *    "id": id
 *  }
 */