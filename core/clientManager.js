import Client from "./client.js"
import ClientDirectory, {Address} from "./clientDirectory.js";
import {v4 as uuidv4} from "uuid";


/**@type {ClientDirectory}*/
let clientDirectory = new ClientDirectory();

/**
 * @param {Client} client
 */
function addClient(client) {
    if (clientDirectory.includes(client)) return;

    let rootDir = clientDirectory.getSubdirectory("/");
    if (rootDir.getClients().includes(client)) return;

    rootDir.addClient(client);
}

/**
 * 
 * @param {uuidv4} id 
 * @returns 
 */
function getClientFromId(id) {
    let clients = getClients();
    return clients.find((client) => client.id == id);    
}

/**
 * Returns an array of connected clients 
 * @returns {Client[]}
 */
function getClients(){
    return clientDirectory.getAllClients();
}

function moveClient(client, address) {
    let dir = clientDirectory.createAddress(address);

    clientDirectory.remove(client);
    dir.addClient(client);
}

export {addClient, getClients, getClientFromId, moveClient}