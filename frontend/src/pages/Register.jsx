import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    accountType: "",
    bankDetails: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setMessage("Account created successfully!");

      setFormData({
        fullName: "",
        email: "",
        mobile: "",
        accountType: "",
        bankDetails: "",
        password: "",
      });
    } catch (err) {
      setError("Cannot connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EBDD] flex items-center justify-center px-4 py-10 text-black">

      <div className="w-full max-w-lg bg-[#D6B98C] rounded-2xl shadow-lg p-8 text-black">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">
            RentAll
          </h1>

          <h2 className="text-2xl font-semibold text-black mt-3">
            Create Your Account
          </h2>

          <p className="text-gray-700 mt-2">
            Join RentAll as a renter or lender
          </p>
        </div>

        {/* Registration Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Full Name
            </label>

            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-400 rounded-lg
                         text-black placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-400 rounded-lg
                         text-black placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Mobile Number
            </label>

            <input
              type="tel"
              name="mobile"
              placeholder="Enter your mobile number"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-400 rounded-lg
                         text-black placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Account Type
            </label>

            <div className="flex gap-6">

              <label className="flex items-center gap-2 cursor-pointer text-black">
                <input
                  type="radio"
                  name="accountType"
                  value="renter"
                  checked={formData.accountType === "renter"}
                  onChange={handleChange}
                  required
                />
                <span>Renter</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-black">
                <input
                  type="radio"
                  name="accountType"
                  value="lender"
                  checked={formData.accountType === "lender"}
                  onChange={handleChange}
                />
                <span>Lender</span>
              </label>

            </div>
          </div>

          {/* Bank Details */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Bank Details
            </label>

            <input
              type="text"
              name="bankDetails"
              placeholder="Enter your bank details"
              value={formData.bankDetails}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-400 rounded-lg
                         text-black placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border border-gray-400 rounded-lg
                         text-black placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-700 text-sm font-medium">
              {error}
            </p>
          )}

          {/* Success */}
          {message && (
            <p className="text-green-700 text-sm font-medium">
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg
                       font-semibold hover:bg-gray-800 transition"
          >
            Create Account
          </button>

        </form>

        {/* Login */}
        <p className="text-center text-sm text-gray-700 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-black font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;