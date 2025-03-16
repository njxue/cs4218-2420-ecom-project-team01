import mongoose from "mongoose";
import colors from "colors";
import { createAdminUserIfNotExists } from "./setupUser";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white
    );
    if (process.env.DEV_MODE === "development") {
      await createAdminUserIfNotExists();
    }
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
