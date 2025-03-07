import "dotenv/config";
import express from "express";
import corsConfig from "./config/corsConfig.js";
import connectDB from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import surveyRoutes from "./routes/surveyRoutes.js";
import pinRoutes from "./routes/pinRoutes.js";
import cors from "cors";

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(corsConfig); //cors middleware
app.options('*', cors()); //for preflight requests
app.use(express.json()); //parse json bodies in the request

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/survey", surveyRoutes);
app.use("/pin", pinRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
