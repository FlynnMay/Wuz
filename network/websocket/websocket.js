import WebSocket, { WebSocketServer } from "ws";
import handleMessage from "./handlers/messageHandler.js";
import { v4 as uuidv4 } from "uuid";
import Client from "../../core/client.js";
import * as wuz from "../../core/wuz.js";

export var clients = [];

export const createWebsocket = (server) => {
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
        console.log("New client connected");
        
        const client = new Client(ws, uuidv4());
        clients.push(client);
        wuz.addClient(client);
        
        wuz.eventBus.on("processed", (data) => {
            const id = clients.find(c => c.socket === ws).id;

            if (ws.readyState === WebSocket.OPEN) {
                const data_string = JSON.stringify(data);
                if(data.is_command && data.application_id == id || client.name == "speaker")
                    ws.send(JSON.stringify({action: 'client_command', payload: data_string}));
                else
                    ws.send(JSON.stringify({action: 'output', payload: data_string}));
            }
        });
    
        ws.on("message", (message) => handleMessage(ws, message));
        
        ws.on("close", () => {
            clients = clients.filter(c => c.socket != ws);
            console.log("Client disconnected");
        });
    });
}