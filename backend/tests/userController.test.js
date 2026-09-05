jest.mock("../src/models/user", () => ({
  findById: jest.fn(),
}));

const User = require("../src/models/user");

const {
  getProfile,
  updateProfile,
  updateVerificationStatus,
} = require("../src/controllers/userController");

describe("User Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        userId: "123",
      },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should return user profile", async () => {
    const mockUser = {
      _id: "123",
      fullName: "Test User",
      email: "test@gmail.com",
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test("should return 404 when user is not found", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("should update user profile", async () => {
    req.body = {
      fullName: "Updated User",
      mobile: "01800000000",
      dropOffLocation: "Dhaka",
    };

    const mockUser = {
      fullName: "Old User",
      mobile: "01700000000",
      dropOffLocation: "",
      save: jest.fn().mockResolvedValue({
        _id: "123",
        fullName: "Updated User",
        email: "test@gmail.com",
        mobile: "01800000000",
        accountType: "renter",
        dropOffLocation: "Dhaka",
        identityVerified: false,
      }),
    };

    User.findById.mockResolvedValue(mockUser);

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should reject invalid verification status", async () => {
    req.body = {
      verificationStatus: "invalid",
    };

    await updateVerificationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should update verification status successfully", async () => {
    req.body = {
      verificationStatus: "verified",
    };

    const mockUser = {
      verificationStatus: "pending",
      identityVerified: false,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findById.mockResolvedValue(mockUser);

    await updateVerificationStatus(req, res);

    expect(mockUser.verificationStatus).toBe("verified");
    expect(mockUser.identityVerified).toBe(true);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});