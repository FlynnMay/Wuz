class Client {
    constructor(socket, id, name="default", room="Global") {
        this.socket = socket;
        this.name = name;
        this.id = id;
        this.directory = null;
    }

    setName(name) {
        this.name = name;    
    }
}

export default Client;

/**
 * Returning to this project and i have no idea what my previous intentions were, i know they are bellow but do i really seem like someone who reads?
 * 
 * Heres the new (or same) plan.
 * 
 * Clients need to declare multiple things on connection
 * [ ] Name
 * [ ] Location
 * [ ] Commands/Intents (still not sure about the naming scheme) 
 *          |--- Also on hold cause I'm reworking the basics to set a baseline of efficency
 *          |--- Removing all related code to it for now, it's on github (i hope) 
 * =======================================================================================
 *  
 * What is a client?
 *  
 * A Client is an application which receives access to the output of Wuz through the websockets.
 * It also can influence how wuz responds by supplying a command response structure in the form of a JSON.
 * 
 * Requirements:
 *  [ ] When a client connects it will be given a token
 * 
 *  [ ] The client will provide any alterations to the functionality of Wuz when it connects, through JSON.
 * 
 *  [ ] Wuz will need to know what client application triggered the intent event. This way the system can pass the event back to the client.
 * 
 * Potential Features:
 *  [ ] The server can receive changes from the client on there changes for use in the LLM prompt.
 *          e.g. if an intent is triggered that cause a track to play in spotify, the current playing song can be mentioned.
 *  
 *  [ ] The server can receive updates from the client about the clients status and generate a message from that. 
 * 
 */