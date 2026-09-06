import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-[#5C4630] text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <Link to="/dashboard" className="text-2xl font-bold">
          Rent<span className="text-[#D8C3A5]">All</span>
        </Link>

        <div className="flex items-center gap-6">

          <Link
            to="/dashboard"
            className="hover:text-[#D8C3A5]"
          >
            Dashboard
          </Link>

          <Link
            to="/profile"
            className="hover:text-[#D8C3A5]"
          >
            Profile
          </Link>

          <Link
            to="/verification"
            className="hover:text-[#D8C3A5]"
          >
            Verification
          </Link>

          <Link
            to="/deposit"
            className="hover:text-[#D8C3A5]"
          >
            Deposit
          </Link>

          <span className="text-sm">
            {user?.fullName || "User"}
          </span>

          <button
            onClick={handleLogout}
            className="bg-[#D8C3A5] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#F3EBDD]"
          >
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;