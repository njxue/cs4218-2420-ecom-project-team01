import { beforeEach, expect, jest } from "@jest/globals";
import {
  createProductController,
  deleteProductController,
  getSingleProductController,
  updateProductController,
} from "./productController";
import productModel from "../models/productModel";
import fs from "fs";
import slugify from "slugify";
import { populate } from "dotenv";

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

  test.each([
    ["name", "Name is Required"],
    ["description", "Description is Required"],
    ["price", "Price is Required"],
    ["category", "Category is Required"],
    ["quantity", "Quantity is Required"],
  ])(
    "returns correct error message when %s is missing",
    async (field, expectedMessage) => {
      req.fields[field] = null;

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: expectedMessage });
    }
  );

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
      params: { pid: 1 },
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

  test.each([
    ["name", "Name is Required"],
    ["description", "Description is Required"],
    ["price", "Price is Required"],
    ["category", "Category is Required"],
    ["quantity", "Quantity is Required"],
  ])("when %s is missing", async (field, expectedMessage) => {
    req.fields[field] = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: expectedMessage });
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
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in Update product",
      error: expect.any(Object),
    });
  });
});

describe("Delete Product Controller Test", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { pid: 1 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("should delete product", async () => {
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn(),
    });

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });
  });

  test("returns error message when unexpected error occurs", async () => {
    productModel.findByIdAndDelete.mockImplementation(() => {
      throw new Error();
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting product",
      error: expect.any(Object),
    });
  });
});

describe("Get Single Product Controller Test", () => {
  let req, res, mockProduct;

  beforeEach(() => {
    jest.restoreAllMocks();
    req = {
      params: {
        slug: "test-slug",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProduct = {
      name: "Cool book",
      category: "Book",
    };
  });

  test("should return the product", async () => {
    productModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnValue(mockProduct),
    });
    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product: mockProduct,
    });
  });

  test("returns error message when unexpected error occurs", async () => {
    productModel.findOne.mockImplementation(() => {
      throw new Error();
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single product",
      error: expect.any(Object),
    });
  });
});
