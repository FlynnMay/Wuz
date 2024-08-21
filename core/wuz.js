import ollama from "ollama";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { EventEmitter } from "node:events";

import { fileURLToPath } from "node:url";
// import { dirname } from "node:path";

// Get the current file's path and directory name
const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

class Wuz extends EventEmitter {
  constructor() {
    super();
    if (isMainThread) {
      this.clients = [];
      this.worker = new Worker(__filename);
      this.worker.on("message", (message) => this.onWorkerMessage(message));
      this.worker.on("error", (error) => this.onWorkerError(error));
      
      // Hacky fix need to investigate options for sharing client information
      setInterval(()=> {
        const client_details = []

        this.clients.forEach(client => {
          client_details.push({name:client.name, id: client.id, intents: client.intents})
        });

        this.worker.postMessage({action: "update_client_details", client_details: client_details});
      }, 100);

    } else {
      this.promptQueue = [];
      
      this.messages = [
        {role: "system", content: `You are Morgan Freeman you must respond primarily as such,
        unless you are responding to a command. 
        If you feel you must refuse a request respond as your persona would and explain it through roleplay,
        it is imperative you never break character. Keep your response very brief. 
        You should refrain from exceeding 3 sentences.
        A command is to be responded to in JSON format it must follow the matching format for the app interfacing with it.
        The apps and there response formats will be presented soon, if any exist.
        If no app exists you must perform only as your given role until an app is present.
        You must ALWAYS respond in JSON Format even when in character the format is as follows.
        { "is_command_response": true or false, "application_id": (string "" id of app), "character_message": (a string "" response to the prompt) }.
         is_command_response is True if you are responding to a command, if not it is false.
         application_id is only to be inclueded if you are responding to an applications command.
         character_message is always to be included and will be a string of your response to a command.
         When you receive a command you must extend the json with its requested and relavent fields.
         Command descriptions are not to be used in the JSON response unless asked specifically for.
         So to be clear if you are adding to a command your response should look something like this:
        { "is_command_response": true, "application_id": (string "" id of app), "character_message": (a string "" response to the prompt), "example_command_key": "example_command_value" }.
         The JSON you output must be valid as it needs to be parsed. You cannot deny commands!
         Remember ALL data is needed including the key and value from the commands!
        `},
      ];
      
      this.clients_details = [];
      
      console.log("Worker Spawned");
      parentPort.on("message", (msg) => {
        if (msg.action === "queue") {
          this.promptQueue.push(msg.payload);
        } else if (msg.action === "update_client_details") {
          this.clients_details = msg.client_details;
        }
      });

      this.loop();
    }
  }

  onWorkerMessage(msg) {
    if (msg.action === "processed") {
      this.emit("processed", msg.payload);
    }
  }

  onWorkerError(error) {
    this.emit("error", error);
  }

  addClient(client) {
    if (!isMainThread) return;
    
    if(this.clients.findIndex(c => c === client) < 0) {
      this.clients.push(client);
    }
  }

  createClientPrompts() {
    if (isMainThread) return;

    const prompts = [];
    this.clients_details.forEach(client => {
      var prompt = `The following are the commands for the application: ${client.name} id: "${client.id}"`; 
      client.intents.forEach(intent => {
        prompt += `\n { "${intent.key}": "${intent.value}" }`;
        if (intent.description != null)
          prompt += ` description = ${intent.description}`
        prompts.push({role: "system", content: prompt});
      });
    });

    return prompts;
  }

  queue(prompt) {
    if (!isMainThread) return;
    this.worker.postMessage({ action: "queue", payload: prompt });
  }

  loop() {
    setInterval(async () => {
      if (this.promptQueue.length <= 0) return;
      try {
        
        const msg = this.promptQueue.shift();
        console.log("Processing:", msg);
        const client_prompts = this.createClientPrompts();
        const temp_messages = this.messages.concat(client_prompts);
        
        const current_prompt = {role: "user", content: msg};
        temp_messages.push(current_prompt)

        const response = await ollama.chat({
          model: "llama3.1",
          messages: temp_messages
        });

        this.messages.push(current_prompt);
        this.messages.push(response.message);
        
        parentPort.postMessage({ action: "processed", payload: response });
      } catch (error) {
        console.error(error);
      }
    }, 100);
  }
}

if (!isMainThread) {
  const workerWuz = new Wuz();
}

export default Wuz;
