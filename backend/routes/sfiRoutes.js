import express from "express";
import TriggerEvent from "../models/TriggerEvent.js";

const router = express.Router();

router.post("/logTrigger", async (req, res) => {
    try {
        const { username, query_index, detected_state, probabilities, marker_evidence, triny_message } = req.body;

        const event = new TriggerEvent({
            username: username || "anonymous",
            timestamp_ms: Date.now(),
            query_index,
            detected_state,
            probabilities,
            marker_evidence,
            triny_message,
        });

        await event.save();
        res.json({ status: "logged" });
    } catch (error) {
        console.error("Error logging trigger event:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;