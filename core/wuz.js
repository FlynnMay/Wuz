import ollama from "ollama";
import { EventEmitter } from "node:events";

export const eventBus = new EventEmitter();

const clients = []

const messages = [{role: "system", content: `You are Morgan Freeman you must respond primarily as such,
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
   Remember ALL data is needed including the key and value from the commands!`}]


export const addClient = (client) => {
  if(clients.findIndex(c => c === client) < 0) {
    clients.push(client);
  }
}

const createClientPrompts = () => {
  const prompts = [];
  clients.forEach(client => {
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

export const prompt = async (msg) => {
  const client_prompts = createClientPrompts();
  const temp_messages = messages.concat(client_prompts);
  
  const current_prompt = {role: "user", content: msg};
  temp_messages.push(current_prompt)
  
  const response = await ollama.chat({
    model: "llama3.1",
    messages: temp_messages
  });

  messages.push(current_prompt);
  messages.push(response.message);

  eventBus.emit('processed', response);
}
