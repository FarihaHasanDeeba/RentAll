const getDashboard = async (req, res) => {
  try {
    const { accountType } = req.user;

    if (accountType === "renter") {
      return res.status(200).json({
        role: "renter",
        dashboard: {
          title: "Renter Dashboard",
          sections: [
            "My Rented Tools",
            "Active Rentals",
            "Rental History",
            "Security Deposits",
          ],
        },
      });
    }

    if (accountType === "lender") {
      return res.status(200).json({
        role: "lender",
        dashboard: {
          title: "Lender Dashboard",
          sections: [
            "My Listed Products",
            "Product Performance",
            "Rental Activity",
            "Earnings",
          ],
        },
      });
    }

    return res.status(400).json({
      message: "Invalid account type",
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Server error while loading dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};