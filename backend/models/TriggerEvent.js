import mongoose from "mongoose";

const TriggerEventSchema = new mongoose.Schema({
    username: { type: String, required: true },
    timestamp_ms: { type: Number, required: true },
    query_index: { type: Number, required: true },
    detected_state: { type: String, required: true },
    probabilities: { type: Object, required: true },
    marker_evidence: { type: Object, required: true },
    triny_message: { type: String },
});

const TriggerEvent = mongoose.model("TriggerEvent", TriggerEventSchema);
export default TriggerEvent;