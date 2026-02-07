import express from "express";
import dotenv from "dotenv";
import http from "http";
import connectDB from "../database/connect.js";
import userRout from "../routers/userRout.js";
import requestRout from "../routers/requestRout.js";
import PaymentRout from "../routers/PaymentRout.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import socketConnection from "../controller/socket.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

// Connect DB
connectDB();

// Middlewares
app.use(cookieParser());
app.use(cors({
  origin: process.env.Origin,
  credentials: true
}));
app.use(express.json());




// Routes
app.use("/user", userRout);
app.use("/request", requestRout);
app.use("/Payment", PaymentRout);


const server = http.createServer(app);


socketConnection(server);


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
