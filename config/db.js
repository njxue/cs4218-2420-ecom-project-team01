import mongoose from "mongoose";
import colors from "colors";
import dotenv from "dotenv";
import { populateData } from "./populateData";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

const connectDB = async () => {
  switch (process.env.NODE_ENV) {
    case "development":
      console.log("Connecting to development database...");
      await connectToDevDB();
      break;
    case "test":
      console.log("Connecting to in-memory test database...");
      await connectToTestDB();
      break;
    default:
      console.log("Invalid NODE_ENV value or missing environment variable.");
      break;
  }
};

const connectToDevDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URL);
  console.log(
    `Connected To Mongodb Database [DEVELOPMENT] ${conn.connection.host}`
      .bgMagenta.white
  );
};

const connectToTestDB = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log(
    `Connected To in-memory Mongodb Database [TEST] ${uri}`.bgMagenta.white
  );

  await populateData();
};

export default connectDB;
