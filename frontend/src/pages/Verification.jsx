import { useState } from "react";
import Navbar from "../components/Navbar";

function Verification() {
  const [status, setStatus] = useState("Pending");

  const token = localStorage.getItem("token");

  const submitVerification = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/verification",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            verificationStatus: "pending",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification submission failed");
      }

      setStatus("Submitted");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EBDD]">

      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="bg-[#D8C3A5] rounded-2xl p-8 shadow">

          <h1 className="text-3xl font-bold">
            Identity Verification
          </h1>

          <p className="text-gray-600 mt-2">
            Complete verification to use RentAll securely.
          </p>

          <div className="bg-[#F9F5ED] rounded-xl p-5 mt-8">

            <div className="flex justify-between">
              <span className="font-semibold">
                Verification Status
              </span>

              <span className="font-bold">
                {status}
              </span>
            </div>

          </div>

          <div className="mt-6">

            <label className="block font-semibold mb-2">
              National ID Number
            </label>

            <input
              type="text"
              placeholder="Enter your NID number"
              className="w-full p-3 rounded-lg border bg-[#F9F5ED]"
            />

          </div>

          <button
            onClick={submitVerification}
            className="w-full bg-[#5C4630] text-white py-3 rounded-lg mt-6 font-semibold"
          >
            Submit Verification
          </button>

        </div>

      </div>
    </div>
  );
}

export default Verification;