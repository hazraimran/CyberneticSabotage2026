import {Router} from "express";

const router = Router();

router.get("/", (req, res) => {
    res.status(200).json({message: "Hello Trini"});
});

router.post("/", (req, res) => {
    res.status(200).json({message: "Hello Trini"});
});

export default router;