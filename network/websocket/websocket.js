import WebSocket, { WebSocketServer } from "ws";
import handleMessage from "./handlers/messageHandler.js";
import { v4 as uuidv4 } from "uuid";
import Client from "../../core/client.js";
import * as wuz from "../../core/wuz.js";
import * as clientManager from "../../core/clientManager.js";

export const createWebsocket = (server) => {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {

        const client = new Client(ws, uuidv4());
        clientManager.addClient(client);

        wuz.eventBus.on("processed", (data) => {
            // const id = clients.find(c => c.socket === ws).id;

            if (ws.readyState === WebSocket.OPEN) {
                const data_string = JSON.stringify(data);
                if (client.name === 'speaker')
                    ws.send(JSON.stringify({ action: 'client_command', payload: data_string }));
                else
                    ws.send(JSON.stringify({ action: 'output', payload: data_string }));
            }
        });

        wuz.eventBus.on('msg_stream', (data) => {
            if (ws.readyState === WebSocket.OPEN && client.name === 'speaker') {
                let command = JSON.stringify({ action: 'stream', payload: data.seg, stream_id: data.id });
                // console.log(command);
                ws.send(command);
            }
        });

        wuz.eventBus.on('msg_stream_init', (data) => {
            console.log(data)
            if (ws.readyState === WebSocket.OPEN && client.name === 'speaker') {
                let command = JSON.stringify({ action: 'stream_init', stream_id: data.id });
                // console.log(command);
                ws.send(command);
            }
        });

        wuz.eventBus.on('msg_stream_end', (data) => {
            if (ws.readyState === WebSocket.OPEN && client.name === 'speaker') {
                let command = JSON.stringify({ action: 'stream_end', stream_id: data.id });
                // console.log(command);
                ws.send(command);
            }
        });

        ws.on("message", (message) => handleMessage(ws, message));

        ws.on("close", () => {
            let clients = clientManager.getClients();
            clients = clients.filter(c => c.socket != ws);
            console.log(`Client disconnected. Current Clients: ${clients.length}`);
        });

        ws.send(JSON.stringify({ action: 'test' }));
        console.log(`New client connected. Current Clients: ${clientManager.getClients().length}`);
    });
}