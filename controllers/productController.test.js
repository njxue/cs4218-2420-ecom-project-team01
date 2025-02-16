import { beforeEach, expect, jest } from "@jest/globals";
import {
  createProductController,
  updateProductController,
} from "./productController";
import productModel from "../models/productModel";
import fs from "fs";
import slugify from "slugify";

jest.mock("../models/productModel.js");
jest.mock("fs");
jest.mock("braintree");
jest.mock("slugify");

describe("Create Product Controller Test", () => {
  let req, res, mockProductInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    slugify.mockImplementation((str) => str);

    mockProductInstance = {
      name: "Cool product",
      description: "This is a cool product",
      price: 100,
      category: "category",
      quantity: 10,
      shipping: false,
      photo: {
        data: "fakeData",
        contentType: "image/jpeg",
      },
      save: jest.fn(),
    };

    const { name, description, price, category, quantity, photo } =
      mockProductInstance;

    req = {
      fields: {
        name,
        description,
        price,
        category,
        quantity,
      },
      files: {
        photo: {
          size: 1000000, // Maximum valid size
          path: "/fakepath/images/photo",
          type: photo.type,
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("should create and save product", () => {
    let assertProductSaved;

    beforeEach(() => {
      jest.clearAllMocks();
      fs.readFileSync = jest.fn();
      productModel.mockReturnValue(mockProductInstance);

      assertProductSaved = () => {
        expect(productModel).toHaveBeenCalledWith({
          ...req.fields,
          slug: slugify(req.fields.name),
        });
        expect(mockProductInstance.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product Created Successfully",
          products: mockProductInstance,
        });
      };
    });

    test("when all fields are present and valid", async () => {
      await createProductController(req, res);

      assertProductSaved();
    });

    test("when photo is missing", async () => {
      req.files.photo = null;

      await createProductController(req, res);

      assertProductSaved();
    });

    test("when shipping is missing", async () => {
      req.fields.shipping = null;

      await createProductController(req, res);

      assertProductSaved();
    });
  });

  test("returns correct error message when product name is not provided", async () => {
    req.fields.name = null;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  test("returns correct error message when product description is not provided", async () => {
    req.fields.description = null;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
  });

  test("returns correct error message when product price is not provided", async () => {
    req.fields.price = null;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
  });

  test("returns correct error message when product category is not provided", async () => {
    req.fields.category = null;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
  });

  test("returns correct error message when product quantity is not provided", async () => {
    req.fields.quantity = null;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
  });

  test("returns correct error message when photo is more than 1mb in size", async () => {
    req.files.photo.size = 1000001;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });
});

// =============== Update Product Controller ===============
describe("Update Product Controller Test", () => {
  let req, res, mockProductInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    slugify.mockImplementation((str) => str);

    mockProductInstance = {
      name: "Updated Cool product",
      description: "This is an updated cool product",
      price: 100,
      category: "updated category",
      quantity: 10,
      shipping: false,
      photo: {
        data: "fakeData",
        contentType: "image/jpeg",
      },
      save: jest.fn(),
    };

    const { name, description, price, category, quantity, shipping, photo } =
      mockProductInstance;

    req = {
      fields: {
        name,
        description,
        price,
        category,
        quantity,
        shipping,
      },
      files: {
        photo: {
          size: 1000000, // Maximum valid size
          path: "/fakepath/images/photo",
          type: photo.type,
        },
      },
      params: { id: 1 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe("should update and save product", () => {
    let assertProductSaved;

    beforeEach(() => {
      jest.clearAllMocks();
      fs.readFileSync = jest.fn();
      productModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockProductInstance);

      assertProductSaved = () => {
        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          req.params.pid,
          { ...req.fields, slug: slugify(req.fields.name) },
          { new: true }
        );
        expect(mockProductInstance.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product Updated Successfully",
          products: mockProductInstance,
        });
      };
    });

    test("when all fields are present and valid", async () => {
      await updateProductController(req, res);

      assertProductSaved();
    });

    test("when photo is missing", async () => {
      req.files.photo = null;

      await updateProductController(req, res);

      assertProductSaved();
    });

    test("when shipping is missing", async () => {
      req.fields.shipping = null;

      await updateProductController(req, res);

      assertProductSaved();
    });
  });

  test("returns correct error message when product name is not provided", async () => {
    req.fields.name = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  test("returns correct error message when product description is not provided", async () => {
    req.fields.description = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
  });

  test("returns correct error message when product price is not provided", async () => {
    req.fields.price = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
  });

  test("returns correct error message when product category is not provided", async () => {
    req.fields.category = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
  });

  test("returns correct error message when product quantity is not provided", async () => {
    req.fields.quantity = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
  });

  test("returns correct error message when photo is more than 1mb in size", async () => {
    req.files.photo.size = 1000001;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  test("returns general error message when product does not exists", async () => {
    productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in Update product",
      })
    );
  });
});

describe("Delete Product Controller Test", () => {});
