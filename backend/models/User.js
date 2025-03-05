import mongoose from "mongoose";

const questionSchema = mongoose.Schema({
    questionId: { type: String, required: true },
    timeUsed: { type: Number, required: true },
    hintsUsed: { type: Number, required: true },
    query: { type: String },
    isCorrect: { type: Boolean },
});

const userSchema = mongoose.Schema(
    {
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        score: { type: Number, default: 150 },
        totalQueriesSolved: { type: Number, default: 0 },
        questions: [questionSchema],
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
