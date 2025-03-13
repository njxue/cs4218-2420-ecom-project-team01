import mongoose from "mongoose";
import {
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
  expect,
} from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import productRoutes from "../routes/productRoutes.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import path from "path";
import productModel from "../models/productModel.js";

let mongodb;
let app;

beforeAll(async () => {
  mongodb = await MongoMemoryServer.create();
  const uri = mongodb.getUri();
  await mongoose.connect(uri);
  app = express();
  app.use(express.json());
  app.use("/api/v1/product", productRoutes);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongodb.stop();
});

afterEach(async () => {
  jest.restoreAllMocks();
  const productCollection = mongoose.connection.collections.products;
  if (productCollection) {
    await productCollection.deleteMany();
  }
});

const getTestProduct = () => ({
  name: "Test product",
  description: "Test product description",
  price: 99,
  category: new mongoose.Types.ObjectId().toString(),
  quantity: 19,
  shipping: true,
  photo: path.resolve("__tests__/assets/test-small.jpg"),
  slug: "test-product",
});

describe("Protected Endpoint Tests", () => {
  let token, testProduct;

  // Sign in as admin
  beforeAll(async () => {
    const testAdminUser = {
      name: "Test User",
      email: "testuser@test.com",
      password: "testPassword123",
      phone: "12345678",
      address: {},
      answer: "Test answer",
      role: 1,
    };
    const user = await userModel.create(testAdminUser);
    token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
  });

  beforeEach(() => {
    testProduct = getTestProduct();
  });

  describe("Create Product Controller Test", () => {
    let sendRequest;

    beforeEach(() => {
      sendRequest = async () => {
        return await request(app)
          .post("/api/v1/product/create-product")
          .set("Authorization", `Bearer ${token}`)
          .field("name", testProduct.name)
          .field("description", testProduct.description)
          .field("price", testProduct.price)
          .field("category", testProduct.category)
          .field("quantity", testProduct.quantity)
          .field("shipping", testProduct.shipping)
          .attach("photo", testProduct.photo);
      };
    });

    test("should save the product to database", async () => {
      const response = await sendRequest();
      const product = await productModel.findOne({ name: testProduct.name });

      expect(product).toBeDefined();
      expect(product.name).toBe(testProduct.name);
      expect(product.description).toBe(testProduct.description);
      expect(product.price).toBe(testProduct.price);
      expect(product.quantity).toBe(testProduct.quantity);
      expect(product.shipping).toBe(testProduct.shipping);
      expect(product.category.toString()).toBe(testProduct.category);
      expect(product.photo).toBeDefined();
      expect(product.photo.data).toBeDefined();
      expect(response.status).toBe(201);
    });

    test("should return error when there is database error", async () => {
      jest
        .spyOn(productModel.prototype, "save")
        .mockRejectedValue(new Error("Database error"));
      jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

      const response = await sendRequest();

      expect(response.status).toBe(500);
    });
  });

  describe("Update Product Controller Test", () => {
    let updatedProduct, sendRequest, productId;

    beforeAll(async () => {
      const existingProduct = await productModel.create(testProduct);
      productId = existingProduct._id.toString();
    });
    beforeEach(() => {
      updatedProduct = {
        name: "Updated product name",
        description: "Updated product description",
        price: 79,
        quantity: 1,
        shipping: false,
        category: new mongoose.Types.ObjectId().toString(),
      };
      sendRequest = async () => {
        return await request(app)
          .put(`/api/v1/product/update-product/${productId}`)
          .set("Authorization", `Bearer ${token}`)
          .field("name", updatedProduct.name)
          .field("description", updatedProduct.description)
          .field("price", updatedProduct.price)
          .field("quantity", updatedProduct.quantity)
          .field("shipping", updatedProduct.shipping)
          .field("category", updatedProduct.category);
      };
    });

    test("should update the product in the database", async () => {
      const response = await sendRequest();
      const product = await productModel.findOne({ _id: productId });

      expect(product).toBeDefined();
      expect(product.name).toBe(updatedProduct.name);
      expect(product.description).toBe(updatedProduct.description);
      expect(product.price).toBe(updatedProduct.price);
      expect(product.quantity).toBe(updatedProduct.quantity);
      expect(product.shipping).toBe(updatedProduct.shipping);
      expect(product.category.toString()).toBe(updatedProduct.category);
      expect(response.status).toBe(201);
    });

    test("should return error when there is database error", async () => {
      jest
        .spyOn(productModel, "findByIdAndUpdate")
        .mockRejectedValue(new Error("Database error"));
      jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

      const response = await sendRequest();

      expect(response.status).toBe(500);
    });
  });
});
