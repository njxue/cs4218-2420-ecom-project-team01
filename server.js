import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";

// configure env
dotenv.config();

//database config
connectDB();

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// rest api

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

const node_env = process.env.NODE_ENV;
const PORT =
  node_env === "development"
    ? process.env.PORT ?? 6060
    : process.env.TEST_PORT ?? 7070;

app.listen(PORT, () => {
  console.log(
    `Server running on ${process.env.NODE_ENV} mode on ${PORT}`.bgCyan.white
  );
});
