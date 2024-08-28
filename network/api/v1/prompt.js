import express from "express";
import * as wuz from "../../../core/wuz.js";

const router = express.Router();

router.post('/', (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
  
    wuz.prompt(message);
  
    res.json({ success: true, message: "Message prompted, a response will be generated shortly." });
})

export default router;