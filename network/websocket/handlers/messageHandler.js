import { clients } from "../websocket.js";

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
    client.addIntent(message_data.value, message_data.description);
    ws.send(JSON.stringify({action: 'client_update', message: `intend added updated to ${client.name}: value=${message_data.value}, description=${message_data.description} `}));
}
  
const webSocketActions = {'get_id': get_id, 'set_name': set_name, 'add_intent': add_intent}

const handleMessage = (ws, message) => {
    try {
        const data = JSON.parse(message);
        webSocketActions[data.action](ws, data);        
    } catch (error) {
        console.error('Error parsing JSON', error);
    }
}

export default handleMessage;