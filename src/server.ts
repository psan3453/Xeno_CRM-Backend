import "./config/env";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT is not defined in environment variables.");
}

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
