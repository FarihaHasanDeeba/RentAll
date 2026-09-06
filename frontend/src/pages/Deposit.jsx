import { useState } from "react";
import Navbar from "../components/Navbar";

function Deposit() {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);

  const handleDeposit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://localhost:5000/api/deposits",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Deposit failed");
      }

      setBalance(data.balance || Number(amount));
      setAmount("");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EBDD]">

      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">

        <h1 className="text-3xl font-bold">
          Security Deposit Wallet
        </h1>

        <p className="text-gray-600 mt-2">
          Manage your security deposits for RentAll rentals.
        </p>

        {/* Balance */}
        <div className="bg-[#5C4630] text-white rounded-2xl p-8 mt-8">

          <p className="text-[#D8C3A5]">
            Available Deposit
          </p>

          <h2 className="text-4xl font-bold mt-2">
            ৳ {balance}
          </h2>

        </div>

        {/* Deposit Form */}
        <div className="bg-[#D8C3A5] rounded-2xl p-8 mt-6">

          <h2 className="text-xl font-bold">
            Add Security Deposit
          </h2>

          <form onSubmit={handleDeposit} className="mt-5">

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              className="w-full p-3 rounded-lg border bg-[#F9F5ED]"
            />

            <button
              type="submit"
              className="w-full bg-[#5C4630] text-white py-3 rounded-lg mt-4 font-semibold"
            >
              Add Deposit
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}

export default Deposit;