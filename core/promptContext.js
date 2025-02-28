
class PromptContext {
    constructor (initialSystemPrompt = "", maxHistoryDepth = -1) {
        this.initialPrompt = { role: "system", content: initialSystemPrompt }
        this.messageHistory = []
        this.maxHistoryDepth = maxHistoryDepth;
    }

    build() {
        return [this.initialPrompt].concat(this.messageHistory)
    }

    appendHistory(sender, message) {
        if (this.maxHistoryDepth === 0) return;

        this.messageHistory.push({ role: sender, content: message })

        if (this.maxHistoryDepth <= -1) return;

        const depth = this.maxHistoryDepth - this.messageHistory.length

        if (depth < 0) {
            this.messageHistory.splice(0, Math.abs(depth));
        }
    }
}

class Message {
    constructor(){
        
    }
}

export const MessageRole = {
    SYSTEM: "system",
    USER: "user",
    ASSISTANT: "assistant",
    TOOL: "tool"    
};

export default PromptContext;

/**
 * Welcome to yet another complete refactor! This time we are talking about a prompt context.
 * 
 * So what is a Prompt Context?
 * It defines the history of communication so Ollama can referernce it.
 * The max length of which can be customised so ollama doesn't take too long to generate a response
 * 
 * NOW for the new and very important questions! 
 * Should it be what keeps track of our current generating prompt?
 * Should it be built out of the address system? 
 *      Would that mean you only listen to the current address and all children or just the current?
 *      If we go down this road how does that work when the address system is seperated into its own microservice that WuzAI hooks into for UI control and other purposes?
 *      
 */