require("dotenv").config();
process.env.JWT_SECRET = "test-secret";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../src/models/user", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const User = require("../src/models/user");

const {
  registerUser,
  loginUser,
} = require("../src/controllers/authController");

describe("Auth Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should reject registration when required fields are missing", async () => {
    req.body = {
      email: "test@gmail.com",
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should reject registration when email already exists", async () => {
    req.body = {
      fullName: "Test User",
      email: "test@gmail.com",
      mobile: "01700000000",
      accountType: "renter",
      bankDetails: "Test Bank",
      password: "123456",
    };

    User.findOne.mockResolvedValue({
      email: "test@gmail.com",
    });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test("should register a new user successfully", async () => {
    req.body = {
      fullName: "Test User",
      email: "test@gmail.com",
      mobile: "01700000000",
      accountType: "renter",
      bankDetails: "Test Bank",
      password: "123456",
    };

    User.findOne.mockResolvedValue(null);

    User.create.mockResolvedValue({
      _id: "123",
      fullName: "Test User",
      email: "test@gmail.com",
      mobile: "01700000000",
      accountType: "renter",
      bankDetails: "Test Bank",
    });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("should reject login with wrong password", async () => {
    req.body = {
      email: "test@gmail.com",
      password: "wrongpassword",
    };

    const hashedPassword = await bcrypt.hash("correctpassword", 10);

    User.findOne.mockResolvedValue({
      _id: "123",
      email: "test@gmail.com",
      password: hashedPassword,
      accountType: "renter",
    });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("should login successfully with correct password", async () => {
    req.body = {
      email: "test@gmail.com",
      password: "correctpassword",
    };

    const hashedPassword = await bcrypt.hash("correctpassword", 10);

    User.findOne.mockResolvedValue({
      _id: "123",
      email: "test@gmail.com",
      password: hashedPassword,
      accountType: "renter",
    });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});