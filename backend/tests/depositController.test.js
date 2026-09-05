jest.mock("../src/models/deposit", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
}));

const Deposit = require("../src/models/deposit");

const {
  createDeposit,
  getDeposits,
  getDepositById,
  updateDepositStatus,
} = require("../src/controllers/depositController");

describe("Deposit Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        userId: "123",
      },
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test("should reject deposit without required information", async () => {
    req.body = {};

    await createDeposit(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("should create a deposit successfully", async () => {
    req.body = {
      rentalId: "456",
      amount: 5000,
    };

    Deposit.create.mockResolvedValue({
      _id: "deposit123",
      user: "123",
      rentalId: "456",
      amount: 5000,
      status: "PENDING",
    });

    await createDeposit(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("should retrieve user's deposits", async () => {
    Deposit.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          amount: 5000,
          status: "PENDING",
        },
      ]),
    });

    await getDeposits(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should reject invalid deposit status", async () => {
    req.params.id = "deposit123";
    req.body.status = "INVALID";

    await updateDepositStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});