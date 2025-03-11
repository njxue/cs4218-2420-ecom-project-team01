import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../controllers/authController";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import JWT from "jsonwebtoken";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("jsonwebtoken");
jest.mock("../helpers/authHelper.js");

describe("Auth Controllers", () => {
  describe("registerController", () => {
    it("should register a user successfully", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "test@example.com",
          password: "password123",
          phone: "123456789",
          address: "123 Street",
          answer: "Swimming",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);
      userModel.prototype.save = jest.fn().mockResolvedValue(req.body);

      hashPassword.mockResolvedValue("hashedPassword");

      await registerController(req, res);
      expect(userModel.prototype.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "User Register Successfully",
        user: req.body,
      });
    });

    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        body: {
          name: "John Doe",
          email: "john.doe@example.com",
          password: "password123",
          phone: "12344000",
          address: "123 Street",
          answer: "Swimming",
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
    });

    const testCases = [
      { field: "name", message: "Name is Required" },
      { field: "email", message: "Email is Required" },
      { field: "password", message: "Password is Required" },
      { field: "phone", message: "Phone number is Required" },
      { field: "address", message: "Address is Required" },
      { field: "answer", message: "Answer is Required" },
    ];

    test.each(testCases)(
      "should return error when %s is missing",
      async ({ field, message }) => {
        req.body[field] = "";
        await registerController(req, res);
        expect(res.send).toHaveBeenCalledWith({ message });
      }
    );

    it("should return error if email format is invalid", async () => {
      req.body.email = "invalid-email";
      await registerController(req, res);
      expect(res.send).toHaveBeenCalledWith({
        message: "Email format is invalid",
      });
    });

    it("should return error if user already exists", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "test@example.com",
          password: "password123",
          phone: "123456789",
          address: "123 Street",
          answer: "Swimming",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue(true);

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Registered. Please login",
      });
    });

    it("should handle errors correctly", async () => {
      req.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "12345678",
        address: "123 Street",
        answer: "Swimming",
      };

      userModel.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Registration",
        error: new Error("Database error"),
      });
    });
  });

  describe("loginController", () => {
    it("should login the user successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        name: "John Doe",
        email: "test@example.com",
        password: "hashedPassword",
      });
      comparePassword.mockResolvedValue(true);
      JWT.sign = jest.fn().mockReturnValue("mockToken");

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "login successfully",
        user: expect.objectContaining({
          name: "John Doe",
          email: "test@example.com",
        }),
        token: "mockToken",
      });
    });

    it("should return error if user not found", async () => {
      const req = {
        body: {
          email: "wrongemail@example.com",
          password: "password123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registered",
      });
    });

    it("should return 404 if email or password is missing", async () => {
      const req = {
        body: {
          email: "",
          password: "",
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid email or password",
        })
      );
    });

    it("should return error if password is incorrect", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "wrongPassword",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        name: "John Doe",
        email: "test@example.com",
        password: "hashedPassword",
      });
      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });

    it("should handle errors correctly", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "wrongPassword",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      userModel.findOne.mockRejectedValue(new Error("Database error"));

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in login",
        error: new Error("Database error"),
      });
    });
  });

  describe("forgotPasswordController", () => {
    it("should reset password successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          answer: "Swimming",
          newPassword: "newPassword123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        email: "test@example.com",
        answer: "Swimming",
      });
      hashPassword.mockResolvedValue("newHashedPassword");
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });

    it("should return error if email or answer is incorrect", async () => {
      const req = {
        body: {
          email: "test@example.com",
          answer: "Wrong answer",
          newPassword: "newPassword123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      userModel.findOne = jest.fn().mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Wrong Email or Answer",
      });
    });

    it("should return error if parameters are missing", async () => {
      const req = {
        body: {
          email: "",
          answer: "",
          newPassword: "",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Email is required",
      });
    });

    it("should handle errors correctly", async () => {
      const req = {
        body: {
          email: "test@example.com",
          answer: "Swimming",
          newPassword: "newPassword123",
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      userModel.findOne.mockRejectedValue(new Error("Database error"));

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
        error: new Error("Database error"),
      });
    });
  });

  describe("testController", () => {
    it("should return protected routes", () => {
      const req = {};
      const res = {
        send: jest.fn(),
      };

      testController(req, res);

      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should handle errors correctly", async () => {
      const req = {};
      const res = {
        send: jest.fn(),
      };
      const error = new Error("Unexpected Error");
      res.send.mockImplementationOnce(() => {
        throw error;
      });

      testController(req, res);

      expect(res.send).toHaveBeenCalledWith({ error });
    });
  });

  describe("updateProfileController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        body: {
          name: "Updated Name",
          phone: "9876543210",
          address: "456 New Street",
        },
        user: { _id: "user123" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
      userModel.findById = jest.fn().mockResolvedValue({
        _id: "user123",
        name: "Original Name",
        email: "user@example.com",
        password: "hashedOldPassword",
        phone: "1234567890",
        address: "123 Old Street",
      });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: "user123",
        name: "Updated Name",
        email: "user@example.com",
        phone: "9876543210",
        address: "456 New Street",
      });
    });

    it("should update profile successfully", async () => {
      await updateProfileController(req, res);

      expect(userModel.findById).toHaveBeenCalledWith("user123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        {
          name: "Updated Name",
          password: "hashedOldPassword",
          phone: "9876543210",
          address: "456 New Street",
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expect.any(Object),
      });
    });

    it("should reject short passwords", async () => {
      req.body.password = "short";

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Password is required and 6 character long",
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should hash the password when provided", async () => {
      req.body.password = "newPassword123";
      hashPassword.mockResolvedValue("newHashedPassword");

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("newPassword123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        {
          name: "Updated Name",
          password: "newHashedPassword",
          phone: "9876543210",
          address: "456 New Street",
        },
        { new: true }
      );
    });

    it("should use existing values when fields are not provided", async () => {
      req.body = {}; // No fields to update

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        {
          name: "Original Name",
          password: "hashedOldPassword",
          phone: "1234567890",
          address: "123 Old Street",
        },
        { new: true }
      );
    });

    it("should handle errors correctly", async () => {
      userModel.findById.mockRejectedValue(new Error("Database error"));

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Update profile",
        error: expect.any(Error),
      });
    });
  });

  describe("getOrdersController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        user: { _id: "user123" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
      jest.mock("../models/orderModel.js");
    });

    it("should return user orders successfully", async () => {
      const mockOrders = [
        { _id: "order1", products: ["product1"], buyer: "user123" },
        { _id: "order2", products: ["product2"], buyer: "user123" },
      ];

      const mockPopulateProducts = {
        populate: jest.fn().mockReturnThis(),
        find: jest.fn().mockReturnThis(),
      };

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrders),
        }),
      });

      await getOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it("should handle empty orders", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      await getOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle errors correctly", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      await getOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: expect.any(Error),
      });
    });
  });

  describe("getAllOrdersController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("should return all orders successfully", async () => {
      const mockOrders = [
        { _id: "order1", products: ["product1"], buyer: { name: "User1" } },
        { _id: "order2", products: ["product2"], buyer: { name: "User2" } },
      ];

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      });

      await getAllOrdersController(req, res);

      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it("should handle empty orders list", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await getAllOrdersController(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle errors correctly", async () => {
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });

      await getAllOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: expect.any(Error),
      });
    });
  });

  describe("orderStatusController", () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        params: { orderId: "order123" },
        body: { status: "Completed" },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it("should update order status successfully", async () => {
      const updatedOrder = {
        _id: "order123",
        status: "Completed",
        products: ["product1"],
      };

      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);

      await orderStatusController(req, res);

      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "order123",
        { status: "Completed" },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedOrder);
    });

    it("should handle non-existent order", async () => {
      orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await orderStatusController(req, res);

      expect(res.json).toHaveBeenCalledWith(null);
    });

    it("should handle errors correctly", async () => {
      orderModel.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await orderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Order",
        error: expect.any(Error),
      });
    });
  });
});
