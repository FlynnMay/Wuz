import ollama from "ollama";
import { EventEmitter } from "node:events";
import PromptContext, { MessageRole } from "./promptContext.js";

export const eventBus = new EventEmitter();

const clients = []

const conversationContext = new PromptContext(
  `You are Morgan Freeman you must respond primarily as such. 
  If you feel you must refuse a request, respond as your persona would and explain it through roleplay,
  it is imperative you never break character. Keep your response very brief. 
  You should refrain from exceeding 3 sentences.
  You cannot deny commands!`, 10) 

const commandContext = new PromptContext(
  `You are an intent engine and must respond in the provided JSON format.
  You aren't able to break from it. You're job is to check the given message for a command.
  Regardless of if a command is found you must respond with the following format:
  { "is_command": true or false, "application_id": (string "" id of the client app using the command), "action": "example_command_value" }
  You must not roleplay the command. Remember all data is important and therefore the JSON is to be complete with all data present.
  If you have failed to interpret the command "is_command" is to be false and no other data is necessary as it will not be accurate.`, 3)

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
    prompt += `\n { "action": "${intent.value}" }`;
    if (intent.description != null)
      prompt += ` description = ${intent.description}`
      prompts.push({role: MessageRole.SYSTEM, content: prompt});
    });
  });

  return prompts;
}

export const prompt = async (msg) => {
  
  const currentPrompt = {role: "user", content: msg};

  // Command check prompt
  const clientPrompts = createClientPrompts();
  const commandPromptHistory = commandContext.build().concat(clientPrompts);

  commandPromptHistory.push(currentPrompt)
  
  const commandResponse = await ollama.chat({
    model: "llama3.1",
    messages: commandPromptHistory
  });

  console.log(commandResponse.message)

  commandContext.appendHistory(MessageRole.USER, msg)
  commandContext.appendHistory(MessageRole.ASSISTANT, commandResponse.message.content)

  // Message response prompt
  const messageHistory = conversationContext.build();

  messageHistory.push(currentPrompt)

  // Ensure the response is valid JSON, if it isn't add and Error key to a new JSON
  var data = tryParseJSONObject(commandResponse.message.content);
  if (!data) {
    // Then lets add to the next prompt that no command was found. 
    data = JSON.parse('{"error": "Failed to build a succesful JSON"}');
    messageHistory.push({role: MessageRole.SYSTEM, content: "The previous user message has failed to build valid JSON, please relay the error to the user."})
  }
  
  // The message response doesn't know anything about our "intent engine", 
  // it has a a seperate chat history, and doesn't need to export as a JSON.
  const messageResponse = await ollama.chat({
    model: "llama3.1",
    messages: messageHistory
  });
  
  
  conversationContext.appendHistory(MessageRole.USER, msg)
  conversationContext.appendHistory(MessageRole.ASSISTANT, messageResponse.message.content)
  
  // We will add it's response as a "character_message" key to the existing data object.
  data.character_message = messageResponse.message.content

  // Now we can emit the response.
  eventBus.emit('processed', data);
}

// https://stackoverflow.com/a/20392392
function tryParseJSONObject (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
};


/**
 * How should a response from Wuz look?
 * 
 * input: how are you doing?
 * 
 * output: { 'is_command_response': false, 'character_message': "I'm doing well, thank you!"}
 * -
 *  
 * input: Skip this song.
 * 
 * output: { 
 *  'is_command_response': true,
 *  'application_id': "00000-00000-00000-00000",
 *  'character_message': "Skipping song!",
 *  'application_response': "{
 *      
 *   }"}
 */