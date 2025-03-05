import express from "express";
import { getUsers, submitUserData } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/submitUserData", submitUserData);

export default router;
