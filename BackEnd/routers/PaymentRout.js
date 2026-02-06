import express from "express";
import authMiddleware from "../middleweare/authenticaton.js";
import { order , verifyPayment} from "../controller/Payment.js";

const router = express.Router();


// Payment order route
router.post("/order/:id", authMiddleware, order);
router.get("/verify/:id", authMiddleware, verifyPayment);



export default router;