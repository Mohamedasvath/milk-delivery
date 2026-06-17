import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";

//Routes Path
import customerRoutes from "./routes/customerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import milkEntryRoutes from "./routes/milkEntryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🥛 MilkMan API Running");
});

//Routes 
app.use("/api/customers", customerRoutes);
app.use("/api/settings", settingsRoutes);
app.use( "/api/milk-entry", milkEntryRoutes);

app.use( "/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/reports", protect, reportRoutes);



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
  console.log("JWT CHECK:", process.env.JWT_SECRET);
});