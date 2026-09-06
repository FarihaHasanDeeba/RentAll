import { useState } from "react";
import Navbar from "../components/Navbar";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    bankDetails: user?.bankDetails || "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Update failed");
      }

      localStorage.setItem("user", JSON.stringify(data.user || formData));

      setMessage("Profile updated successfully.");

    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EBDD]">

      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="bg-[#D8C3A5] rounded-2xl p-8 shadow">

          <h1 className="text-3xl font-bold">
            My Profile
          </h1>

          <p className="text-gray-600 mt-2 mb-6">
            Manage your RentAll account information.
          </p>

          {message && (
            <div className="bg-[#F9F5ED] rounded-lg p-3 mb-5">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <label className="block font-semibold mb-2">
              Full Name
            </label>

            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border mb-5 bg-[#F9F5ED]"
            />

            <label className="block font-semibold mb-2">
              Email
            </label>

            <input
              name="email"
              value={formData.email}
              disabled
              className="w-full p-3 rounded-lg border mb-5 bg-gray-200"
            />

            <label className="block font-semibold mb-2">
              Mobile
            </label>

            <input
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border mb-5 bg-[#F9F5ED]"
            />

            <label className="block font-semibold mb-2">
              Bank Details
            </label>

            <input
              name="bankDetails"
              value={formData.bankDetails}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border mb-6 bg-[#F9F5ED]"
            />

            <button
              type="submit"
              className="w-full bg-[#5C4630] text-white py-3 rounded-lg font-semibold"
            >
              Save Changes
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}

export default Profile;