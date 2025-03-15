import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { hashPassword } from "../helpers/authHelper";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const USERS_COLLECTION = "users";

const adminUser = {
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

    if (existingUser) {
      console.log(
        "Admin user 'cs4218@test.com' exists, deleting old user......"
      );
      await collection.deleteOne({ email: adminUser.email });
      console.log("Deleted old admin user");
    }

    const hashedPassword = await hashPassword(adminUser.password);
    await collection.insertOne({ ...adminUser, password: hashedPassword });
    console.log("Created new admin user 'cs4218@test.com'");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    await client.close();
  }
};
