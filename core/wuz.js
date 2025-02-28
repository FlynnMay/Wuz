import ollama from "ollama";
import { EventEmitter } from "node:events";
import PromptContext, { MessageRole } from "./promptContext.js";
import { v4 as uuidv4 } from "uuid";

export const eventBus = new EventEmitter();

/**@type {uuidv4[]} */
let _prompts = []

const conversationContext = new PromptContext(
  `You are Morgan Freeman you must respond only as such. 
  If you feel you must refuse a request, respond as your persona would and explain it through roleplay,
  it is imperative you never break character. Keep your response very brief. 
  You should refrain from exceeding 3 sentences. Do NOT include descriptions on how you are speaking in your response, or any parenthesis with mood explantion.
  You cannot deny commands!`, 10) 

export const prompt = async (msg) => {
  const promptId = uuidv4();
  _prompts.push(promptId);

  const currentPrompt = {role: "user", content: msg};

  const messageHistory = conversationContext.build();

  messageHistory.push(currentPrompt)

  var data = tryParseJSONObject('{ "is_command": true }');

  // The message response doesn't know anything about our "intent engine", 
  // it has a a seperate chat history, and doesn't need to export as a JSON.
  const messageResponse = await ollama.chat({
    model: "llama3.2",
    messages: messageHistory,
    stream: true
  });
  
  let content = '';
  let streamData = {};
  streamData.id = promptId;
  eventBus.emit('msg_stream_init', { "id": streamData.id });
  
  for await (const part of messageResponse) {
    let seg = part.message.content;
    content += seg;
    process.stdout.write(seg);
    streamData.seg = seg;
    eventBus.emit('msg_stream', streamData);
  }

  eventBus.emit('msg_stream_end', { "id": streamData.id });
  
  conversationContext.appendHistory(MessageRole.USER, msg);
  conversationContext.appendHistory(MessageRole.ASSISTANT, content);
  
  // We will add it's response as a "character_message" key to the existing data object.
  data.character_message = content;

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