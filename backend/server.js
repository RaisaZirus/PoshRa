// const express = require("express")
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();
import productRoutes from "./routes/productRoutes.js"
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";

//const cors = require('cors');
const app = express();

const PORT = process.env.PORT;
console.log(PORT);

app.use(express.json());
app.use(cors());
app.use(helmet());//security middleware 
app.use(morgan("dev")); // log the request

//apply arcjet rate to all routes 
app.use(async (req, res, next) =>{
    try{
        const decision = await aj.protect(req, {
            requested: 1,
        })
        if(decision.isDenied()){
            if(decision.reason.isRateLimit()){
                res.status(429).json({error: "Too Many Requests"});
            } else if(decision.reason.isBot()){
                res.status(403).json({error: "Bot access denied"});
            }else{
                res.status(403).json({error: "Forbidden"});
            }
            return
        }
        //checked for spoofed bots
        if(decision.results.some((result)=> result.reason.isBot() && result.reason.isSpoofed())){
            res.status(403).json({error: "Spoofed bot detected"});
        }
        next();
    }catch(error){
        console.log("Arjet error", error);
        next(error);
    }
})

app.use("/api/products", productRoutes);

async function initDB(){
    try{
        await sql`
            CREATE TABLE IF NOT EXISTS products(
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

            )
        `;
        console.log("DB Initialized successfully");
    }catch(error){
        console.log("Error initdb", error);
    }
}
initDB().then(()=>{
    app.listen(PORT, ()=>{
        console.log("Server is running on port "+PORT);
    });
});

