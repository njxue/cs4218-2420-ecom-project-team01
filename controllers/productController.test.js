import { beforeEach, expect, jest } from "@jest/globals";
import {
  brainTreePaymentController,
  braintreeTokenController,
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  relatedProductController,
  searchProductController,
  updateProductController,
} from "./productController";
import productModel from "../models/productModel";
import categoryModel from "../models/categoryModel";
import orderModel from "../models/orderModel";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";

jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
jest.mock("fs");
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockReturnValue({
    clientToken: { generate: jest.fn() },
    transaction: { sale: jest.fn() },
  }),
  Environment: {
    Sandbox: "mockSandbox",
  },
}));
jest.mock("slugify");

describe("Create Product Controller Test", () => {
  let req, res, mockProductInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    slugify.mockImplementation((str) => str);
    mockProductInstance = {
      name: "Cool product",
      description: "This is a cool product",
      price: 0,
      category: "category",
      quantity: 0,
      shipping: false,
      photo: {
        data: "fakeData",
        contentType: "image/jpeg",
      },
      save: jest.fn(),
    };
    const { name, description, price, category, quantity, photo, shipping } =
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
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("when all fields are present and valid", async () => {
    fs.readFileSync = jest.fn();
    productModel.mockReturnValue(mockProductInstance);

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Created Successfully",
      products: mockProductInstance,
    });
  });

  test.each([
    ["name", "Name is Required"],
    ["description", "Description is Required"],
    ["price", "Price is Required"],
    ["category", "Category is Required"],
    ["quantity", "Quantity is Required"],
    ["shipping", "Shipping is Required"],
  ])(
    "returns correct error message when %s is missing",
    async (field, expectedMessage) => {
      req.fields[field] = null;

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: expectedMessage });
    }
  );

  test("returns correct error message when photo is missing", async () => {
    req.files.photo = null;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: "Photo is Required" });
  });

  test("returns correct error message when photo is more than 1mb in size", async () => {
    req.files.photo.size = 1000001;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Photo should be less then 1mb",
    });
  });

  test("returns correct error message when price is negative", async () => {
    req.fields.price = -1;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Price cannot be negative",
    });
  });

  test("returns correct error message when quantity is negative", async () => {
    req.fields.quantity = -1;

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Quantity cannot be negative",
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error in creating product",
      success: false,
      error,
    });
  });
});

// ==================== Update Product Controller ====================
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
    fs.readFileSync = jest.fn();
  });

  test("updates and saves product when all required fields are present and valid", async () => {
    productModel.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue(mockProductInstance);

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Updated Successfully",
      products: mockProductInstance,
    });
  });

  test("updates and saves product even when photo is missing", async () => {
    productModel.findByIdAndUpdate = jest
      .fn()
      .mockResolvedValue(mockProductInstance);

    req.files.photo = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Updated Successfully",
      products: mockProductInstance,
    });
  });

  test.each([
    ["name", "Name is Required"],
    ["description", "Description is Required"],
    ["price", "Price is Required"],
    ["category", "Category is Required"],
    ["quantity", "Quantity is Required"],
    ["shipping", "Shipping is Required"],
  ])("when %s is missing", async (field, expectedMessage) => {
    req.fields[field] = null;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: expectedMessage });
  });

  test("returns correct error message when photo is more than 1mb in size", async () => {
    req.files.photo.size = 1000001;

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  test("returns correct error message when product is not found", async () => {
    productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.findByIdAndUpdate.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error in Update product",
      success: false,
      error,
    });
  });
});

// ==================== Delete Product Controller ====================
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

  test("deletes product", async () => {
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

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.findByIdAndDelete.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting product",
      error,
    });
  });
});

// ==================== Get Single Product Controller ====================

describe("Get Single Product Controller Test", () => {
  let req, res, mockProduct;

  beforeEach(() => {
    jest.clearAllMocks();
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

  test("returns the product", async () => {
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

  test("returns error message when product is not found", async () => {
    productModel.findOne.mockReturnValue(null);

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.findOne.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting single product",
      error,
    });
  });
});

// ==================== Get Product Controller ====================
describe("Get Product Controller Test", () => {
  let res, mockProducts, mockSort;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      {
        name: "Cool book",
        category: "Book",
      },
      {
        name: "Cool potato",
        category: "Food",
      },
    ];
    mockSort = jest.fn().mockReturnValue(mockProducts);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: mockSort,
    });
  });

  test("returns products if they exist", async () => {
    await getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Products",
      products: mockProducts,
      counTotal: mockProducts.length,
    });
  });

  test("returns empty list of products if no products exists", async () => {
    mockSort.mockReturnValue([]);

    await getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Products",
      products: [],
      counTotal: 0,
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  });
});

// ==================== Product List Controller ====================
describe("Product List Controller Test", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { page: 2 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      {
        name: "Cool book",
        category: "Book",
      },
      {
        name: "Cool potato",
        category: "Food",
      },
    ];

    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnValue(mockProducts),
    });
  });

  test("returns products when page number is a valid positive number", async () => {
    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  test("defaults page number to 1 when provided page number is invalid", async () => {
    req.params.page = -1;

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  });
});

// ==================== Product Photo Controller ====================
describe("Product Photo Controller Test", () => {
  let req, res, mockProduct;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: { pid: 1 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn(),
    };
    mockProduct = {
      photo: {
        data: "fakeData",
        contentType: "image/jpeg",
      },
    };
  });

  test("returns product photo if it exists", async () => {
    productModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue(mockProduct),
    });

    await productPhotoController(req, res);

    expect(res.set).toHaveBeenCalledWith(
      "Content-type",
      mockProduct.photo.contentType
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
  });

  test("returns error message when product does not exists", async () => {
    productModel.findById.mockReturnValue(null);

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  test("returns error message when product photo does not exists", async () => {
    mockProduct.photo = null;
    productModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue(mockProduct),
    });

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Photo not found",
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.findById.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while getting photo",
      error,
    });
  });
});

// ==================== Product Filters Controller ====================
describe("Product Filters Controller Test", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        checked: ["Book", "Food"],
        radio: [10, 20],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      {
        name: "Cool book",
        catgeory: "Book",
        price: 10,
      },
      {
        name: "Cool potato",
        category: "Food",
        price: 20,
      },
    ];
    productModel.find.mockReturnValue(mockProducts);
  });

  test("returns products when products are found", async () => {
    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  test("returns all products when price and category filters are not provided", async () => {
    req.body.checked = undefined;
    req.body.radio = undefined;

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  test("returns all products when any price is selected and no category filters are not provided", async () => {
    req.body.checked = undefined;
    req.body.radio = [0, null];

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  test("returns empty list of products when no products are found", async () => {
    productModel.find.mockReturnValue([]);

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: [],
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while Filtering Products",
      error,
    });
  });
});

// ==================== Product Count Controller ====================
describe("Product Count Controller Test", () => {
  let res, mockTotal;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockTotal = 10;
  });

  test("returns product count", async () => {
    const mockEstimatedDocumentCount = jest.fn().mockReturnValue(mockTotal);
    productModel.find.mockReturnValue({
      estimatedDocumentCount: mockEstimatedDocumentCount,
    });

    await productCountController({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, total: mockTotal });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await productCountController({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error in product count",
      success: false,
      error,
    });
  });
});

// ==================== Search Product Controller ====================
describe("Search Product Controller Test", () => {
  let req, res, mockProducts;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: { keyword: "potato" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    mockProducts = [
      {
        name: "Cool book",
        description: "A cool book about potatos",
      },
      {
        name: "Cool potato",
        description: "A cool potato",
      },
    ];
    productModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProducts),
    });
  });

  test("returns products when keyword is provided", async () => {
    await searchProductController(req, res);

    expect(res.json).toHaveBeenCalledWith(mockProducts);
  });

  test("returns empty products list when no products are found", async () => {
    productModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    await searchProductController(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await searchProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  });
});

// ==================== Related Product Controller ====================
describe("Related Product Controller Test", () => {
  let req, res, mockProducts, mockPopulate;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      params: {
        pid: 1,
        cid: 2,
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockProducts = [
      {
        name: "Cool potato",
        category: "Food",
      },
      {
        name: "Cool tomato",
        category: "Food",
      },
    ];
    mockPopulate = jest.fn().mockReturnValue(mockProducts);
    productModel.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: mockPopulate,
    });
  });

  test("returns products when pid and cid are provided", async () => {
    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: mockProducts,
    });
  });

  test("returns error message when pid is not provided", async () => {
    req.params.pid = undefined;

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "pid is missing",
    });
  });

  test("returns error message when cid is not provided", async () => {
    req.params.cid = undefined;

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "cid is missing",
    });
  });

  test("returns empty products list when products are not found", async () => {
    mockPopulate.mockReturnValue([]);

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products: [],
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error while geting related product",
      success: false,
      error,
    });
  });
});

// ==================== Product Category Controller ====================
describe("Product Category Controller Test", () => {
  let req, res, mockCategory, mockProducts;

  beforeEach(() => {
    jest.clearAllMocks();
    slugify.mockImplementation((str) => str);
    req = {
      params: { slug: "test-slug" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockCategory = "Food";
    mockProducts = [
      {
        name: "Cool potato",
        category: mockCategory,
      },
      {
        name: "Cool tomato",
        category: mockCategory,
      },
    ];
    categoryModel.findOne.mockReturnValue(mockCategory);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue(mockProducts),
    });
  });

  test("returns category and products if they exist", async () => {
    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: mockProducts,
    });
  });

  test("returns null category and empty list of products when category is not found", async () => {
    categoryModel.findOne.mockReturnValue(null);
    productModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue([]),
    });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: null,
      products: [],
    });
  });

  test("returns category and empty list of products when category found but no products are found", async () => {
    productModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue([]),
    });

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: mockCategory,
      products: [],
    });
  });

  test("returns error message when database error occurs", async () => {
    const error = new Error("Database error");
    productModel.find.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: "Error While Getting products",
      success: false,
      error,
    });
  });
});

// ==================== Brain Tree Token Controller ====================
describe("Brain Tree Token Controller Test", () => {
  let gateway, res;

  beforeEach(() => {
    gateway = new braintree.BraintreeGateway();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("returns token on success", async () => {
    const mockRes = { success: true, clientToken: "token" };
    gateway.clientToken.generate.mockImplementation((_, cb) => {
      cb(null, mockRes);
    });

    await braintreeTokenController({}, res);

    expect(gateway.clientToken.generate).toHaveBeenCalledWith(
      {},
      expect.any(Function)
    );
    expect(res.send).toHaveBeenCalledWith(mockRes);
  });

  test("returns error on client token generation failure", async () => {
    const mockError = { message: "Braintree gateway error" };
    gateway.clientToken.generate.mockImplementation((_, cb) => {
      cb(mockError, null);
    });

    await braintreeTokenController({}, res);

    expect(gateway.clientToken.generate).toHaveBeenCalledWith(
      {},
      expect.any(Function)
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  test("logs error on unexpected error", async () => {
    const error = new Error("Unexpected error");
    gateway.clientToken.generate.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await braintreeTokenController({}, res);

    expect(gateway.clientToken.generate).toHaveBeenCalledWith(
      {},
      expect.any(Function)
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });
});

// ==================== Brain Tree Payment Controller ====================
describe("Brain Tree Payment Controller Test", () => {
  let gateway, req, res;

  beforeEach(() => {
    gateway = new braintree.BraintreeGateway();
    req = {
      body: { nonce: "mockNonce", cart: [{ price: 100 }, { price: 200 }] },
      user: { _id: 1 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  test("saves order when nonce, cart and user id are valid and provided", async () => {
    const mockRes = { success: true };
    gateway.transaction.sale.mockImplementation((_, cb) => {
      cb(null, mockRes);
    });
    orderModel.prototype.save = jest.fn();

    await brainTreePaymentController(req, res);

    expect(gateway.transaction.sale).toHaveBeenCalledWith(
      {
        amount: 300,
        paymentMethodNonce: req.body.nonce,
        options: {
          submitForSettlement: true,
        },
      },
      expect.any(Function)
    );
    expect(orderModel).toHaveBeenCalledWith({
      products: req.body.cart,
      payment: mockRes,
      buyer: req.user._id,
    });
    expect(orderModel.prototype.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test("returns correct error when nonce is not provided", async () => {
    req.body.nonce = undefined;

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Nonce is empty");
  });

  test("returns correct error when cart is invalid", async () => {
    req.body.cart = undefined;

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Cart is empty");
  });

  test("returns correct error when user id is not provided", async () => {
    req.user._id = undefined;

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("User id is empty");
  });

  test("returns error on transaction error", async () => {
    const mockError = { message: "Transaction error" };
    gateway.transaction.sale.mockImplementation((_, cb) => {
      cb(mockError, null);
    });

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  test("logs error on unexpected error", async () => {
    const error = new Error("Transaction error");
    gateway.transaction.sale.mockImplementation(() => {
      throw error;
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await brainTreePaymentController(req, res);

    expect(console.log).toHaveBeenCalledWith(error);
  });
});
