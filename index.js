import express from "express";
import http from "http";
import prompt from "./network/api/v1/prompt.js"
import * as wuz from "./core/wuz.js";
import { createWebsocket } from "./network/websocket/websocket.js";

const app = express();

const port = 3000;

wuz.eventBus.on('processed', (payload) => {
  console.log(payload);
})

app.use(express.json());

app.use('/api/v1/prompt', prompt)

const server = http.createServer(app);

createWebsocket(server);

server.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`);
});