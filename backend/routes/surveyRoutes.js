import express from "express";
import { createSurvey } from "../controllers/surveyController.js";

const router = express.Router();

router.post("/submitSurveyResponse", createSurvey);

export default router;
