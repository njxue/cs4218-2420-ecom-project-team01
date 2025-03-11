import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "./orderModel.js";

describe("Order Model Test Suite", () => {
  let mongoServer;

  // Connect to in-memory database before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // Disconnect and close connection after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear all collections after each test
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  // Test schema structure validation
  test("order schema has the correct fields", () => {
    const orderSchemaKeys = Object.keys(Order.schema.paths);
    expect(orderSchemaKeys).toContain("products");
    expect(orderSchemaKeys).toContain("payment");
    expect(orderSchemaKeys).toContain("buyer");
    expect(orderSchemaKeys).toContain("status");
    expect(orderSchemaKeys).toContain("createdAt");
    expect(orderSchemaKeys).toContain("updatedAt");
  });

  // Test products field array structure
  test('products field is an array of ObjectIds referencing "Products" collection', () => {
    const productsPath = Order.schema.path("products");
    expect(productsPath.instance).toBe("Array");
    const productType = productsPath.caster;
    expect(productType.instance).toBe("ObjectId");
    expect(productType.options.ref).toBe("Products");
    expect(productsPath.options.required[0]).toBe(true);
    expect(productsPath.options.required[1]).toBe("Products are required");
  });

  // Test payment field structure
  test("payment field is a required object", () => {
    const paymentPath = Order.schema.path("payment");
    expect(paymentPath.instance).toBe("Mixed");
    expect(paymentPath.options.required[0]).toBe(true);
    expect(paymentPath.options.required[1]).toBe("Payment information is required");
  });

  // Test buyer field structure
  test('buyer field is a required ObjectId referencing "users" collection', () => {
    const buyerPath = Order.schema.path("buyer");
    expect(buyerPath.instance).toBe("ObjectId");
    expect(buyerPath.options.ref).toBe("users");
    expect(buyerPath.options.required[0]).toBe(true);
    expect(buyerPath.options.required[1]).toBe("Buyer information is required");
  });

  // Test status field structure
  test("status field is a required string with default value and enum validator", () => {
    const statusPath = Order.schema.path("status");
    expect(statusPath.instance).toBe("String");
    expect(statusPath.defaultValue).toBe("Not Process");
    expect(statusPath.options.enum).toEqual([
      "Not Process",
      "Processing",
      "Shipped",
      "Deliverd",
      "Cancel",
    ]);
    expect(statusPath.options.required).toBe(true);
  });

  // Test timestamps functionality
  test("schema has timestamps enabled", () => {
    const timestamps = Order.schema.options.timestamps;
    expect(timestamps).toBe(true);
  });

  // Test order creation
  test("can create an order with valid fields", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const validOrder = new Order({
      products: [productId],
      payment: { method: "credit_card", amount: 50.0 },
      buyer: buyerId,
      status: "Processing",
    });

    const savedOrder = await validOrder.save();
    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.products[0].toString()).toBe(productId.toString());
    expect(savedOrder.payment.method).toBe("credit_card");
    expect(savedOrder.payment.amount).toBe(50.0);
    expect(savedOrder.buyer.toString()).toBe(buyerId.toString());
    expect(savedOrder.status).toBe("Processing");
    expect(savedOrder.createdAt).toBeDefined();
    expect(savedOrder.updatedAt).toBeDefined();
  });

  // Test default status
  test('status defaults to "Not Process" if not provided', async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const orderWithoutStatus = new Order({
      products: [productId],
      payment: { method: "credit_card", amount: 50.0 },
      buyer: buyerId,
    });

    const savedOrder = await orderWithoutStatus.save();
    expect(savedOrder.status).toBe("Not Process");
  });

  // Test invalid status value
  test("rejects invalid status values", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const orderWithInvalidStatus = new Order({
      products: [productId],
      payment: { method: "credit_card", amount: 50.0 },
      buyer: buyerId,
      status: "Invalid Status",
    });

    let error;
    try {
      await orderWithInvalidStatus.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe("ValidationError");
    expect(error.errors.status).toBeDefined();
  });

  // Test multiple products
  test("can store multiple products in an order", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId1 = new mongoose.Types.ObjectId();
    const productId2 = new mongoose.Types.ObjectId();
    const productId3 = new mongoose.Types.ObjectId();

    const orderWithMultipleProducts = new Order({
      products: [productId1, productId2, productId3],
      payment: { method: "credit_card", amount: 150.0 },
      buyer: buyerId,
    });

    const savedOrder = await orderWithMultipleProducts.save();
    expect(savedOrder.products).toHaveLength(3);
    expect(savedOrder.products[0].toString()).toBe(productId1.toString());
    expect(savedOrder.products[1].toString()).toBe(productId2.toString());
    expect(savedOrder.products[2].toString()).toBe(productId3.toString());
  });

  // Test complex payment object
  test("can store complex payment information", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const complexPayment = {
      method: "credit_card",
      amount: 99.99,
      currency: "USD",
      cardDetails: {
        last4: "4242",
        brand: "Visa",
        expiryMonth: 12,
        expiryYear: 2025,
      },
      billingAddress: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "94001",
      },
      transactionId: "txn_123456789",
      status: "succeeded",
    };

    const orderWithComplexPayment = new Order({
      products: [productId],
      payment: complexPayment,
      buyer: buyerId,
    });

    const savedOrder = await orderWithComplexPayment.save();
    expect(savedOrder.payment).toEqual(complexPayment);
  });

  // Test required fields validation - buyer
  test("buyer field is required", async () => {
    const productId = new mongoose.Types.ObjectId();
    const orderWithoutBuyer = new Order({
      products: [productId],
      payment: { method: "credit_card", amount: 50.0 },
    });

    let error;
    try {
      await orderWithoutBuyer.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe("ValidationError");
    expect(error.errors.buyer).toBeDefined();
    expect(error.errors.buyer.message).toBe("Buyer information is required");
  });

  // Test required fields validation - payment
  test("payment field is required", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    
    const orderWithoutPayment = new Order({
      products: [productId],
      buyer: buyerId,
    });

    let error;
    try {
      await orderWithoutPayment.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe("ValidationError");
    expect(error.errors.payment).toBeDefined();
    expect(error.errors.payment.message).toBe("Payment information is required");
  });

  // Test empty products array validation
  test("products array cannot be empty", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const orderWithEmptyProducts = new Order({
      products: [],
      payment: { method: "credit_card", amount: 50.0 },
      buyer: buyerId,
    });

    let error;
    try {
      await orderWithEmptyProducts.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe("ValidationError");
    expect(error.errors.products).toBeDefined();
    expect(error.errors.products.message).toBe("Order must contain at least one product");
  });

  // Test missing products field
  test("products field is required", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const orderWithoutProducts = new Order({
      payment: { method: "credit_card", amount: 50.0 },
      buyer: buyerId,
    });

    let error;
    try {
      await orderWithoutProducts.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe("ValidationError");
    expect(error.errors.products).toBeDefined();
    expect(error.errors.products.message).toBe("Order must contain at least one product");
  });

  // Test finding orders by status
  test("can find orders by status", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    // Create orders with different statuses
    await new Order({
      products: [productId],
      payment: { method: "credit_card" },
      buyer: buyerId,
      status: "Processing",
    }).save();

    await new Order({
      products: [productId],
      payment: { method: "paypal" },
      buyer: buyerId,
      status: "Shipped",
    }).save();

    await new Order({
      products: [productId],
      payment: { method: "bank_transfer" },
      buyer: buyerId,
      status: "Processing",
    }).save();

    const processingOrders = await Order.find({ status: "Processing" });
    expect(processingOrders).toHaveLength(2);

    const shippedOrders = await Order.find({ status: "Shipped" });
    expect(shippedOrders).toHaveLength(1);
  });

  // Test finding orders by buyer
  test("can find orders by buyer", async () => {
    const buyer1Id = new mongoose.Types.ObjectId();
    const buyer2Id = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    // Create orders for different buyers
    await new Order({
      products: [productId],
      payment: { method: "credit_card" },
      buyer: buyer1Id,
    }).save();

    await new Order({
      products: [productId],
      payment: { method: "paypal" },
      buyer: buyer1Id,
    }).save();

    await new Order({
      products: [productId],
      payment: { method: "bank_transfer" },
      buyer: buyer2Id,
    }).save();

    const buyer1Orders = await Order.find({ buyer: buyer1Id });
    expect(buyer1Orders).toHaveLength(2);

    const buyer2Orders = await Order.find({ buyer: buyer2Id });
    expect(buyer2Orders).toHaveLength(1);
  });

  // Test updating order status
  test("can update order status", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const order = await new Order({
      products: [productId],
      payment: { method: "credit_card" },
      buyer: buyerId,
      status: "Not Process",
    }).save();

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { status: "Shipped" },
      { new: true }
    );

    expect(updatedOrder.status).toBe("Shipped");

    // Verify in the database
    const retrievedOrder = await Order.findById(order._id);
    expect(retrievedOrder.status).toBe("Shipped");
  });

  // Test updating payment information
  test("can update payment information", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const order = await new Order({
      products: [productId],
      payment: { method: "credit_card" },
      buyer: buyerId,
    }).save();

    const updatedPayment = {
      method: "credit_card",
      amount: 75.0,
      transactionId: "tx_updated123",
      status: "completed",
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { payment: updatedPayment },
      { new: true }
    );

    expect(updatedOrder.payment).toEqual(updatedPayment);

    // Verify in the database
    const retrievedOrder = await Order.findById(order._id);
    expect(retrievedOrder.payment).toEqual(updatedPayment);
  });

  // Test deleting an order
  test("can delete an order", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const order = await new Order({
      products: [productId],
      payment: { method: "credit_card" },
      buyer: buyerId,
    }).save();

    // Verify order exists
    let foundOrder = await Order.findById(order._id);
    expect(foundOrder).not.toBeNull();

    // Delete order
    await Order.findByIdAndDelete(order._id);

    // Verify order no longer exists
    foundOrder = await Order.findById(order._id);
    expect(foundOrder).toBeNull();
  });

  // Test with very large product arrays
  test("can handle orders with many products", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const manyProducts = Array(100)
      .fill()
      .map(() => new mongoose.Types.ObjectId());

    const largeOrder = new Order({
      products: manyProducts,
      payment: { method: "credit_card", amount: 9999.99 },
      buyer: buyerId,
    });

    const savedOrder = await largeOrder.save();
    expect(savedOrder.products).toHaveLength(100);

    // Verify all products were saved correctly
    for (let i = 0; i < 100; i++) {
      expect(savedOrder.products[i].toString()).toBe(
        manyProducts[i].toString()
      );
    }
  });

  // Test with empty payment object
  test("can create order with empty payment object", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const orderWithEmptyPayment = new Order({
      products: [productId],
      payment: {},
      buyer: buyerId,
    });

    const savedOrder = await orderWithEmptyPayment.save();
    expect(savedOrder._id).toBeDefined();
    expect(savedOrder.payment).toEqual({});
  });

  // Test status case sensitivity
  test("status field is case sensitive", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    const orderWithWrongCase = new Order({
      products: [productId],
      payment: { method: "credit_card" },
      buyer: buyerId,
      status: "processing", // lowercase instead of "Processing"
    });

    let error;
    try {
      await orderWithWrongCase.save();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe("ValidationError");
  });

  // Test model name
  test('model name is "Order"', () => {
    expect(Order.modelName).toBe("Order");
  });
});