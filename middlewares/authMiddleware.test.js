import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Authentication Middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ1c2VyMTIzIn0.fake-signature"
            },
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
        next = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("requireSignIn middleware", () => {
        test("should successfully authenticate with valid token", async () => {
            const mockUser = { _id: "user123", name: "Test User" };
            JWT.verify.mockReturnValue(mockUser);

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith(
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ1c2VyMTIzIn0.fake-signature", 
                process.env.JWT_SECRET
            );
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test("should fail when no authorization header is provided", async () => {
            req.headers.authorization = undefined;

            await requireSignIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Authentication required"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should fail with empty authorization header", async () => {
            req.headers.authorization = "";
            
            await requireSignIn(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Authentication required"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should fail with malformed authorization header (no Bearer prefix)", async () => {
            req.headers.authorization = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.fake-signature";
            
            await requireSignIn(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid token format"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should fail with malformed JWT token format", async () => {
            req.headers.authorization = "Bearer not-a-valid-jwt-token";
            
            await requireSignIn(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid token format"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle JWT verification errors", async () => {
            JWT.verify.mockImplementation(() => {
                throw new Error("Invalid signature");
            });

            await requireSignIn(req, res, next);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired token"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle token expiration specifically", async () => {
            const tokenExpiredError = new Error("jwt expired");
            tokenExpiredError.name = "TokenExpiredError";
            JWT.verify.mockImplementation(() => {
                throw tokenExpiredError;
            });

            await requireSignIn(req, res, next);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Token has expired, please login again"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle JsonWebTokenError", async () => {
            const jsonWebTokenError = new Error("invalid token");
            jsonWebTokenError.name = "JsonWebTokenError";
            JWT.verify.mockImplementation(() => {
                throw jsonWebTokenError;
            });

            await requireSignIn(req, res, next);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired token"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle NotBeforeError", async () => {
            const notBeforeError = new Error("jwt not active");
            notBeforeError.name = "NotBeforeError";
            JWT.verify.mockImplementation(() => {
                throw notBeforeError;
            });

            await requireSignIn(req, res, next);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired token"
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("isAdmin middleware", () => {
        beforeEach(() => {
            req.user = { _id: "admin123" };
        });

        test("should allow access for admin user", async () => {
            userModel.findById.mockResolvedValue({ _id: "admin123", role: 1 });

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("admin123");
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test("should deny access for non-admin user", async () => {
            userModel.findById.mockResolvedValue({ _id: "user123", role: 0 });

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Forbidden: Admin privileges required"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle case when user ID is missing", async () => {
            req.user = {}; // Missing _id

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Authentication required"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle case when user object is missing", async () => {
            req.user = undefined;

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Authentication required"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle case when user is not found in database", async () => {
            userModel.findById.mockResolvedValue(null);

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "User not found"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle database query errors", async () => {
            const dbError = new Error("Database connection error");
            userModel.findById.mockRejectedValue(dbError);

            await isAdmin(req, res, next);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Server error during authorization check",
                error: dbError.message
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle invalid user ID format", async () => {
            const castError = new Error("Cast to ObjectId failed");
            castError.name = "CastError";
            userModel.findById.mockRejectedValue(castError);

            await isAdmin(req, res, next);

            expect(console.error).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid user ID format"
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("should handle different user roles correctly", async () => {
            // Test with role=2 (which is not admin)
            userModel.findById.mockResolvedValue({ _id: "user123", role: 2 });

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Forbidden: Admin privileges required"
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    // Testing middleware integration
    describe("Middleware chain integration", () => {
        test("requireSignIn should set user for isAdmin", async () => {
            const mockUser = { _id: "admin123" };
            JWT.verify.mockReturnValue(mockUser);
            userModel.findById.mockResolvedValue({ _id: "admin123", role: 1 });

            await requireSignIn(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual(mockUser);

            // Reset next mock for the second middleware call
            next.mockReset();

            await isAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
