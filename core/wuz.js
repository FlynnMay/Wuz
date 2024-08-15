import ollama from "ollama";
import { Worker, isMainThread, parentPort } from "node:worker_threads";
import { EventEmitter } from "node:events";

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Get the current file's path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Wuz extends EventEmitter {
  constructor() {
    super();
    if (isMainThread) {
      this.worker = new Worker(__filename);
      this.worker.on("message", (output) => this.onWorkerOutput(output));
      this.worker.on("error", (error) => this.onWorkerError(error));
    } else {
      this.promptQueue = [];
      console.log("Worker Spawned");
      parentPort.on("message", (msg) => {
        if (msg.action === "queue") {
          this.promptQueue.push(msg.payload);
        }
      });

      this.loop();
    }
  }

  onWorkerOutput(msg) {
    if (msg.action === "processed") {
      this.emit("processed", msg.payload);
    }
  }

  onWorkerError(error) {
    this.emit("error", error);
  }

  queue(prompt) {
    if (!isMainThread) return;
    this.worker.postMessage({ action: "queue", payload: prompt });
  }

  loop() {
    setInterval(async () => {
      if (this.promptQueue.length <= 0) return;

      const msg = this.promptQueue.shift();
      console.log("Processing:", msg);

      const response = await ollama.chat({
        model: "llama3.1",
        messages: [{ role: "user", content: `${msg}` }],
      });

      parentPort.postMessage({ action: "processed", payload: response });
    }, 100);
  }
}

if (!isMainThread) {
  const workerWuz = new Wuz();
}

export default Wuz;
