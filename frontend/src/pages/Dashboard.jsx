import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const accountType = user?.accountType || "renter";

  return (
    <div className="min-h-screen bg-[#F3EBDD]">

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold text-black">
          Welcome, {user?.fullName || "User"} 👋
        </h1>

        <p className="text-gray-600 mt-2">
          Your RentAll {accountType} dashboard
        </p>

        {/* Account Status */}
        <div className="mt-8 bg-[#D8C3A5] rounded-2xl p-6">
          <h2 className="text-xl font-bold">
            Account Overview
          </h2>

          <div className="grid md:grid-cols-3 gap-5 mt-5">

            <div className="bg-[#F9F5ED] rounded-xl p-5">
              <p className="text-gray-500">Account Type</p>
              <p className="text-xl font-bold capitalize mt-1">
                {accountType}
              </p>
            </div>

            <div className="bg-[#F9F5ED] rounded-xl p-5">
              <p className="text-gray-500">Verification</p>
              <p className="text-xl font-bold mt-1">
                {user?.isVerified ? "Verified" : "Pending"}
              </p>
            </div>

            <div className="bg-[#F9F5ED] rounded-xl p-5">
              <p className="text-gray-500">Deposit Balance</p>
              <p className="text-xl font-bold mt-1">
                ৳ 0
              </p>
            </div>

          </div>
        </div>

        {/* Renter Dashboard */}
        {accountType === "renter" && (
          <div className="mt-8">

            <h2 className="text-2xl font-bold">
              Renter Dashboard
            </h2>

            <div className="grid md:grid-cols-3 gap-5 mt-5">

              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="font-bold text-lg">
                  Find Equipment
                </h3>

                <p className="text-gray-600 mt-2">
                  Browse equipment available for rent.
                </p>

                <button className="mt-4 bg-[#5C4630] text-white px-4 py-2 rounded-lg">
                  Browse
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="font-bold text-lg">
                  My Rentals
                </h3>

                <p className="text-gray-600 mt-2">
                  View your current and previous rentals.
                </p>

                <button className="mt-4 bg-[#5C4630] text-white px-4 py-2 rounded-lg">
                  View Rentals
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="font-bold text-lg">
                  Security Deposit
                </h3>

                <p className="text-gray-600 mt-2">
                  Manage your rental security deposits.
                </p>

                <Link
                  to="/deposit"
                  className="inline-block mt-4 bg-[#5C4630] text-white px-4 py-2 rounded-lg"
                >
                  Manage Deposit
                </Link>
              </div>

            </div>
          </div>
        )}

        {/* Lender Dashboard */}
        {accountType === "lender" && (
          <div className="mt-8">

            <h2 className="text-2xl font-bold">
              Lender Dashboard
            </h2>

            <div className="grid md:grid-cols-3 gap-5 mt-5">

              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="font-bold text-lg">
                  My Equipment
                </h3>

                <p className="text-gray-600 mt-2">
                  Manage equipment you have listed.
                </p>

                <button className="mt-4 bg-[#5C4630] text-white px-4 py-2 rounded-lg">
                  Manage
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="font-bold text-lg">
                  Rental Requests
                </h3>

                <p className="text-gray-600 mt-2">
                  Review requests from renters.
                </p>

                <button className="mt-4 bg-[#5C4630] text-white px-4 py-2 rounded-lg">
                  View Requests
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="font-bold text-lg">
                  Earnings
                </h3>

                <p className="text-gray-600 mt-2">
                  Track your rental earnings.
                </p>

                <button className="mt-4 bg-[#5C4630] text-white px-4 py-2 rounded-lg">
                  View Earnings
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default Dashboard;