import { registerController, loginController, forgotPasswordController, testController } from "../controllers/authController";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/userModel.js");
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
          answer: "Swimming"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
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
        expect(res.send).toHaveBeenCalledWith({ message: "Email format is invalid" });
    });

    it("should return error if user already exists", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "test@example.com",
          password: "password123",
          phone: "123456789",
          address: "123 Street",
          answer: "Swimming"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      userModel.findOne = jest.fn().mockResolvedValue(true);
      
      await registerController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Registered. Please login"
      });
    });
  });

  describe("loginController", () => {
    it("should login the user successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "password123"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        name: "John Doe",
        email: "test@example.com",
        password: "hashedPassword"
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
          email: "test@example.com"
        }),
        token: "mockToken"
      });
    });

    it("should return error if user not found", async () => {
      const req = {
        body: {
          email: "wrongemail@example.com",
          password: "password123"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      userModel.findOne = jest.fn().mockResolvedValue(null);
      
      await loginController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registered"
      });
    });

    it("should return error if password is incorrect", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "wrongPassword"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        name: "John Doe",
        email: "test@example.com",
        password: "hashedPassword"
      });
      comparePassword.mockResolvedValue(false);
      
      await loginController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password"
      });
    });
  });

  describe("forgotPasswordController", () => {
    it("should reset password successfully", async () => {
      const req = {
        body: {
          email: "test@example.com",
          answer: "Swimming",
          newPassword: "newPassword123"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      userModel.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        email: "test@example.com",
        answer: "Swimming"
      });
      hashPassword.mockResolvedValue("newHashedPassword");
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully"
      });
    });

    it("should return error if email or answer is incorrect", async () => {
      const req = {
        body: {
          email: "test@example.com",
          answer: "Wrong answer",
          newPassword: "newPassword123"
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      userModel.findOne = jest.fn().mockResolvedValue(null);
      
      await forgotPasswordController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Wrong Email or Answer"
      });
    });

    it("should return error if parameters are missing", async () => {
      const req = {
        body: {
          email: "",
          answer: "",
          newPassword: ""
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
      await forgotPasswordController(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Email is required"
      });
    });
  });

  describe("testController", () => {
    it("should return protected routes", () => {
      const req = {};
      const res = {
        send: jest.fn()
      };

      testController(req, res);

      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });
  });
});
