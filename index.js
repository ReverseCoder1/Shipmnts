import express from "express";
import dotenv from 'dotenv';
import { connectMongo } from "./connect.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectMongo().then(() => {
    app.listen(PORT, () => console.log("Server Start at port:", PORT));
}).catch(err => console.error("DB Connection Failed:", err));