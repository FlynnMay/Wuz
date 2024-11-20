
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

        // 3 - 4 = -1
        const depth = this.maxHistoryDepth - this.messageHistory.length

        if (depth < 0) {
            this.messageHistory.splice(0, Math.abs(depth));
        }
    }
}

export const MessageRole = {
    SYSTEM: "system",
    USER: "user",
    ASSISTANT: "assistant",
    TOOL: "tool"    
};

export default PromptContext;