import cors from "cors";
import express, { Application } from "express";
import "./config/env";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import analyticsRoutes from "./routes/analyticsRoutes";
import aiRoutes from "./routes/aiRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import customerRoutes from "./routes/customerRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import orderRoutes from "./routes/orderRoutes";
import receiptRoutes from "./routes/receiptRoutes";

const app: Application = express();

const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error("FRONTEND_URL is not defined in environment variables.");
}

app.use(
  cors({
    origin: frontendUrl,
  }),
);
app.use(express.json());

app.use("/customers", customerRoutes);
app.use("/orders", orderRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/receipt", receiptRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/ai", aiRoutes);

app.use(errorMiddleware);

export default app;
