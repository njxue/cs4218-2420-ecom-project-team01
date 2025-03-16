import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { hashPassword } from "../helpers/authHelper";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const USERS_COLLECTION = "users";

const adminUser = {
  name: "cs4218 admin",
  email: "cs4218@test.com",
  password: "cs4218@test.com",
  role: "1",
  phone: "61234567",
  address: "1 Kent Ridge Ave",
  answer: "Answer",
};

export const createAdminUserIfNotExists = async () => {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(USERS_COLLECTION);

    const existingUser = await collection.findOne({ email: adminUser.email });
    const hashedPassword = await hashPassword(adminUser.password);

    if (existingUser) {
      console.log(
        "Admin user 'cs4218@test.com' exists, updating admin user......"
      );
    } else {
      console.log("Creating admin user 'cs4218@test.com......");
    }
    await collection.updateOne(
      { email: adminUser.email },
      { $set: { ...adminUser, password: hashedPassword } },
      { upsert: true }
    );
    console.log(`Admin user ${existingUser ? "updated" : "created"}`);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    await client.close();
  }
};
