import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensures each username is unique
  },
  responses: {
    type: Object, // object of strings to store user responses
    required: true
  }
});

const UserResponse = mongoose.model('UserResponse', responseSchema);

export default UserResponse;