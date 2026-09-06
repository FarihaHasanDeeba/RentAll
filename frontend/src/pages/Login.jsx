
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Save user information if returned by backend
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EBDD] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black">
            Rent<span className="text-[#8B6F47]">All</span>
          </h1>

          <p className="text-gray-600 mt-2">
            Rent what you need. Share what you have.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#D8C3A5] rounded-2xl shadow-lg p-8">

          <h2 className="text-2xl font-bold text-black text-center">
            Welcome Back
          </h2>

          <p className="text-gray-700 text-center mt-2 mb-6">
            Login to your RentAll account
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-[#F9F5ED] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-[#F9F5ED] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5C4630] text-white py-3 rounded-lg font-semibold hover:bg-[#463522] transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Register */}
          <p className="text-center text-gray-700 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#5C4630] hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;

