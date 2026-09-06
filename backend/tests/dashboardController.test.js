const {
  getDashboard,
} = require("../src/controllers/dashboardController");

describe("Dashboard Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should return renter dashboard", async () => {
    req = {
      user: {
        accountType: "renter",
      },
    };

    await getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "renter",
      })
    );
  });

  test("should return lender dashboard", async () => {
    req = {
      user: {
        accountType: "lender",
      },
    };

    await getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "lender",
      })
    );
  });

  test("should reject invalid account type", async () => {
    req = {
      user: {
        accountType: "invalid",
      },
    };

    await getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});