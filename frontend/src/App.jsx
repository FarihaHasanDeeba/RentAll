import { useState } from "react";
import EquipmentList from "./components/EquipmentList";
import BookingList from "./components/BookingList";
import "./App.css";

function App() {
    const [selectedEquipment, setSelectedEquipment] = useState(null);

    return (
        <>
            {/* ================= NAVBAR ================= */}

            <nav className="navbar">

                <div className="logo-area">

                    <div className="logo-icon">
                        📷
                    </div>

                    <div className="logo-text">

                        <h1>RentAll</h1>

                        <span>
                            Rent Anything, Anytime
                        </span>

                    </div>

                </div>


                <div className="nav-links">

                    <a
                        href="#"
                        className="active"
                    >
                        Home
                    </a>

                    <a href="#equipment">
                        Equipment
                    </a>

                    <a href="#bookings">
                        Bookings
                    </a>

                    <a href="#login">
                        Login
                    </a>

                </div>

            </nav>


            {/* ================= MAIN ================= */}

            <main>

                {/* Page Header */}

                <div className="page-header">

                    <h2 className="page-title">
                        Rent Equipment Easily
                    </h2>

                    <p className="page-subtitle">
                        Find and rent the equipment you need
                        quickly and easily.
                    </p>

                </div>


                {/* ================= EQUIPMENT ================= */}

                <section id="equipment">

                    <EquipmentList
                        onBook={setSelectedEquipment}
                    />

                </section>


                {/* ================= BOOKINGS ================= */}

                <section id="bookings">

                    <BookingList
                        selectedEquipment={selectedEquipment}
                        clearSelectedEquipment={() =>
                            setSelectedEquipment(null)
                        }
                    />

                </section>

            </main>

        </>
    );
}

export default App;