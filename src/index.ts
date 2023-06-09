import express, { Application, Request, Response, NextFunction } from "express";
const app: Application = express();
import cors from "cors";
import dotenv from "dotenv";
import errorHandler from "./middlewares/ErrorHandler";
import connectToDB from "./config/ConnectToDB";
import http from "http";
import { Server } from "socket.io";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Use the express-fileupload middleware

//socket.io
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "*",
  },
});

dotenv.config();

//routes
import AuthRoutes from "./Routes/AuthRoutes";
import ProfileRoutes from "./Routes/ProfileRoutes";
import TestRoutes from "./Routes/TestRoutes";
import mongoose, { mongo } from "mongoose";
import MpesaRoutes from "./Routes/payments/mpesa/MpesaRoutes";

const PORT = process.env.PORT;

connectToDB();

app.get("/", (req: Request, res: Response): void => {
  res.send(
    "<h1>Welcome to Supercart Server</h1> <a href='http://localhost:3000'>Kindly checkout our application</a>"
  );
});

app.use("/auth", AuthRoutes);
app.use("/profile", ProfileRoutes);
app.use("/test", TestRoutes);
app.use("/payments/mpesa", MpesaRoutes);

//Error handling middleware
app.use(errorHandler);

app.use("*", (req, res) => {
  res.status(400).json({
    success: false,
    message: "The requested page was not found on this server.",
  });
});

io.on("connection", (socket) => {});

mongoose.connection.on("open", () => {
  server.listen(PORT, (): void => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
