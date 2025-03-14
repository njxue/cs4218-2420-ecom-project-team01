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

const getTestProducts = () => [
  getTestProduct(),
  {
    name: "Another test product",
    description: "Another test product description",
    price: 199,
    category: new mongoose.Types.ObjectId().toString(),
    quantity: 119,
    shipping: false,
    photo: path.resolve("__tests__/assets/test-small.jpg"),
    slug: "another-test-product",
  },
];

// Creates a test product and save it in the (test) database
const createAndSaveTestProduct = async () => {
  return await productModel.create(getTestProduct());
};

// Erase entire products collection after each test
const restoreProductsCollection = async () => {
  const productCollection = mongoose.connection.collections.products;
  if (productCollection) {
    await productCollection.deleteMany();
  }
};

describe("Protected Endpoints Tests", () => {
  let token;

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

  afterEach(async () => {
    await restoreProductsCollection();
  });

  describe("Create Product Controller Test", () => {
    const ENDPOINT_CREATE_PRODUCT = "/api/v1/product/create-product";

    test("should save the product to database", async () => {
      const testProduct = getTestProduct();
      const response = await request(app)
        .post(ENDPOINT_CREATE_PRODUCT)
        .set("Authorization", `Bearer ${token}`)
        .field("name", testProduct.name)
        .field("description", testProduct.description)
        .field("price", testProduct.price)
        .field("category", testProduct.category)
        .field("quantity", testProduct.quantity)
        .field("shipping", testProduct.shipping)
        .attach("photo", testProduct.photo);

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
      const testProduct = getTestProduct();

      const response = await request(app)
        .post(ENDPOINT_CREATE_PRODUCT)
        .set("Authorization", `Bearer ${token}`)
        .field("name", testProduct.name)
        .field("description", testProduct.description)
        .field("price", testProduct.price)
        .field("category", testProduct.category)
        .field("quantity", testProduct.quantity)
        .field("shipping", testProduct.shipping)
        .attach("photo", testProduct.photo);

      expect(response.status).toBe(500);
    });
  });

  describe("Update Product Controller Test", () => {
    let updatedProduct, existingProduct;
    const ENDPOINT_UPDATE_PRODUCT = "/api/v1/product/update-product";

    beforeEach(async () => {
      existingProduct = await createAndSaveTestProduct();
      updatedProduct = {
        name: "Updated product name",
        description: "Updated product description",
        price: 79,
        quantity: 1,
        shipping: false,
        category: new mongoose.Types.ObjectId().toString(),
      };
    });

    test("should update the product in the database", async () => {
      const response = await request(app)
        .put(`${ENDPOINT_UPDATE_PRODUCT}/${existingProduct.id}`)
        .set("Authorization", `Bearer ${token}`)
        .field("name", updatedProduct.name)
        .field("description", updatedProduct.description)
        .field("price", updatedProduct.price)
        .field("quantity", updatedProduct.quantity)
        .field("shipping", updatedProduct.shipping)
        .field("category", updatedProduct.category);

      const product = await productModel.findOne({ _id: existingProduct.id });

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

      const response = await request(app)
        .put(`${ENDPOINT_UPDATE_PRODUCT}/${existingProduct.id}`)
        .set("Authorization", `Bearer ${token}`)
        .field("name", updatedProduct.name)
        .field("description", updatedProduct.description)
        .field("price", updatedProduct.price)
        .field("quantity", updatedProduct.quantity)
        .field("shipping", updatedProduct.shipping)
        .field("category", updatedProduct.category);

      expect(response.status).toBe(500);
    });
  });

  describe("Delete Product Controller Test", () => {
    let existingProduct;
    const ENDPOINT_DELETE_PRODUCT = "/api/v1/product/delete-product";

    beforeEach(async () => {
      existingProduct = await createAndSaveTestProduct();
    });

    test("should delete product from database", async () => {
      const response = await request(app)
        .delete(`${ENDPOINT_DELETE_PRODUCT}/${existingProduct.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    test("should return error when there is database error", async () => {
      jest.spyOn(productModel, "findByIdAndDelete").mockImplementation(() => {
        throw new Error("Database error");
      });
      jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

      const response = await request(app)
        .delete(`${ENDPOINT_DELETE_PRODUCT}/${existingProduct.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });
});

describe("Public Endpoints Tests", () => {
  describe("Get Single Product Controller Test", () => {
    let existingProduct;
    const ENDPOINT_GET_PRODUCT = "/api/v1/product/get-product";

    beforeAll(async () => {
      existingProduct = await createAndSaveTestProduct();
    });

    afterAll(async () => {
      await restoreProductsCollection();
    });

    test("should fetch product", async () => {
      const response = await request(app).get(
        `${ENDPOINT_GET_PRODUCT}/${existingProduct.slug}`
      );

      expect(response.status).toBe(200);
      expect(response.body.product._id).toBe(existingProduct.id);
    });

    test("should return 404 error when product is not found", async () => {
      const response = await request(app).get(
        `${ENDPOINT_GET_PRODUCT}/non-existent-slug`
      );

      expect(response.status).toBe(404);
    });

    test("should return error when there is database error", async () => {
      jest.spyOn(productModel, "findOne").mockImplementation(() => {
        throw new Error("Database error");
      });
      jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

      const response = await request(app).get(
        `${ENDPOINT_GET_PRODUCT}/${existingProduct.slug}`
      );

      expect(response.status).toBe(500);
    });
  });

  describe("Get Products Controller Test", () => {
    let testProducts;
    const ENDPOINT_GET_PRODUCTS = "/api/v1/product/get-product";

    beforeAll(async () => {
      testProducts = await Promise.all([
        productModel.create(getTestProducts()[0]),
        productModel.create(getTestProducts()[1]),
      ]);
    });

    afterAll(async () => {
      await restoreProductsCollection();
    });

    test("should fetch products", async () => {
      const response = await request(app).get(ENDPOINT_GET_PRODUCTS);

      const receivedIds = response.body.products.map((p) => p._id);
      const expectedIds = testProducts.map((p) => p.id);

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBe(testProducts.length);
      expect(receivedIds).toEqual(expect.arrayContaining(expectedIds));
    });

    test("should return error when there is database error", async () => {
      jest.spyOn(productModel, "find").mockImplementation(() => {
        throw new Error("Database error");
      });
      jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

      const response = await request(app).get(ENDPOINT_GET_PRODUCTS);

      expect(response.status).toBe(500);
    });
  });
});
