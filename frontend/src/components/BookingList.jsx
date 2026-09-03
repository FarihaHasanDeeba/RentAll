import { useEffect, useState } from "react";

function BookingList({
    selectedEquipment,
    clearSelectedEquipment,
}) {
    const [equipment, setEquipment] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        equipment: "",
        userName: "",
        startDate: "",
        endDate: "",
        totalPrice: 0,
    });

    // Fetch equipment
    const fetchEquipment = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/equipment"
            );

            if (!response.ok) {
                throw new Error("Failed to fetch equipment");
            }

            const data = await response.json();
            setEquipment(data);
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
    };

    // Fetch bookings
    const fetchBookings = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/bookings"
            );

            if (!response.ok) {
                throw new Error("Failed to fetch bookings");
            }

            const data = await response.json();
            setBookings(data);
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
        fetchBookings();
    }, []);

    // Select equipment from EquipmentList
    useEffect(() => {
        if (selectedEquipment) {
            setForm((previous) => ({
                ...previous,
                equipment: selectedEquipment._id,
                startDate: "",
                endDate: "",
                totalPrice: 0,
            }));
        }
    }, [selectedEquipment]);

    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Get selected equipment
    const selectedItem = equipment.find(
        (item) => item._id === form.equipment
    );

    // Get bookings for selected equipment
    const selectedEquipmentBookings = bookings.filter(
        (booking) =>
            booking.equipment?._id === form.equipment &&
            ["pending", "confirmed"].includes(booking.status)
    );

    // Check whether selected dates overlap existing booking
    const isDateRangeBooked = () => {
        if (!form.startDate || !form.endDate) {
            return false;
        }

        const selectedStart = new Date(form.startDate);
        const selectedEnd = new Date(form.endDate);

        return selectedEquipmentBookings.some((booking) => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);

            return (
                selectedStart < bookingEnd &&
                selectedEnd > bookingStart
            );
        });
    };

    // Calculate total price
    useEffect(() => {
        if (
            !form.equipment ||
            !form.startDate ||
            !form.endDate
        ) {
            setForm((previous) => ({
                ...previous,
                totalPrice: 0,
            }));
            return;
        }

        const selected = equipment.find(
            (item) => item._id === form.equipment
        );

        if (!selected) return;

        const start = new Date(form.startDate);
        const end = new Date(form.endDate);

        const difference =
            end.getTime() - start.getTime();

        const days = Math.ceil(
            difference / (1000 * 60 * 60 * 24)
        );

        if (days <= 0) {
            setForm((previous) => ({
                ...previous,
                totalPrice: 0,
            }));
            return;
        }

        const total =
            days * Number(selected.pricePerDay);

        setForm((previous) => ({
            ...previous,
            totalPrice: total,
        }));
    }, [
        form.equipment,
        form.startDate,
        form.endDate,
        equipment,
    ]);

    // Submit booking
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.equipment) {
            alert("Please select equipment.");
            return;
        }

        if (!form.userName.trim()) {
            alert("Please enter your name.");
            return;
        }

        if (!form.startDate || !form.endDate) {
            alert("Please select start and end dates.");
            return;
        }

        if (
            new Date(form.endDate) <=
            new Date(form.startDate)
        ) {
            alert("End date must be after start date.");
            return;
        }

        // Frontend availability check
        if (isDateRangeBooked()) {
            alert(
                "This equipment is already booked for the selected dates."
            );
            return;
        }

        if (form.totalPrice <= 0) {
            alert("Total price must be greater than 0.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/bookings",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        equipment: form.equipment,
                        userName: form.userName,
                        startDate: form.startDate,
                        endDate: form.endDate,
                        totalPrice: Number(
                            form.totalPrice
                        ),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                    "Failed to create booking"
                );
                return;
            }

            alert("Booking created successfully!");

            setForm({
                equipment: "",
                userName: "",
                startDate: "",
                endDate: "",
                totalPrice: 0,
            });

            if (clearSelectedEquipment) {
                clearSelectedEquipment();
            }

            fetchBookings();
        } catch (error) {
            console.error(error);
            alert("Server error");
        }
    };

    if (loading) {
        return (
            <p className="loading">
                Loading bookings...
            </p>
        );
    }

    return (
        <section className="booking-section">

            <div className="section-header">
                <h2>Book Equipment</h2>

                <p>
                    Select equipment and check its
                    availability before booking.
                </p>
            </div>

            <div className="booking-form-card">

                <form onSubmit={handleSubmit}>

                    {/* Equipment */}
                    <label>Equipment</label>

                    <select
                        name="equipment"
                        value={form.equipment}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                            Select Equipment
                        </option>

                        {equipment.map((item) => (
                            <option
                                key={item._id}
                                value={item._id}
                                disabled={!item.availability}
                            >
                                {item.name}
                                {" - "}
                                ৳{item.pricePerDay}/day

                                {!item.availability
                                    ? " (Unavailable)"
                                    : ""}
                            </option>
                        ))}
                    </select>

                    {/* Selected Equipment */}
                    {selectedItem && (
                        <div className="selected-equipment">

                            <strong>Selected:</strong>

                            <span>
                                {selectedItem.name}
                            </span>

                            <small>
                                ৳{selectedItem.pricePerDay}
                                /day
                            </small>

                        </div>
                    )}

                    {/* Availability Calendar */}
                    {form.equipment && (
                        <div className="availability-box">

                            <h3>
                                📅 Availability Calendar
                            </h3>

                            {selectedEquipmentBookings.length === 0 ? (
                                <p className="available-message">
                                    ✅ This equipment is
                                    currently available.
                                </p>
                            ) : (
                                <>
                                    <p className="booked-message">
                                        ⚠️ Already booked dates:
                                    </p>

                                    <div className="booked-dates">

                                        {selectedEquipmentBookings.map(
                                            (booking) => (
                                                <div
                                                    className="booked-date"
                                                    key={
                                                        booking._id
                                                    }
                                                >
                                                    <span>
                                                        {new Date(
                                                            booking.startDate
                                                        ).toLocaleDateString()}
                                                    </span>

                                                    <strong>
                                                        →
                                                    </strong>

                                                    <span>
                                                        {new Date(
                                                            booking.endDate
                                                        ).toLocaleDateString()}
                                                    </span>

                                                    <small>
                                                        {booking.status}
                                                    </small>
                                                </div>
                                            )
                                        )}

                                    </div>
                                </>
                            )}

                        </div>
                    )}

                    {/* Name */}
                    <label>Your Name</label>

                    <input
                        type="text"
                        name="userName"
                        placeholder="Enter your name"
                        value={form.userName}
                        onChange={handleChange}
                        required
                    />

                    {/* Start Date */}
                    <label>Start Date</label>

                    <input
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        required
                    />

                    {/* End Date */}
                    <label>End Date</label>

                    <input
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                        required
                    />

                    {/* Date conflict warning */}
                    {form.startDate &&
                        form.endDate &&
                        isDateRangeBooked() && (
                            <div className="date-conflict">
                                ❌ Selected dates are
                                already booked.
                                <br />
                                Please choose another
                                date range.
                            </div>
                        )}

                    {/* Total Price */}
                    <div className="total-price">

                        <span>Total Price</span>

                        <strong>
                            ৳{form.totalPrice}
                        </strong>

                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        className="create-booking-button"
                        disabled={isDateRangeBooked()}
                    >
                        📅 Create Booking
                    </button>

                </form>

            </div>

            {/* Error */}
            {error && (
                <p className="error">
                    {error}
                </p>
            )}

            {/* Booking List */}
            <div className="section-header booking-list-header">

                <h2>My Bookings</h2>

                <p>
                    View all your equipment bookings
                </p>

            </div>

            {bookings.length === 0 ? (

                <div className="empty-bookings">

                    <h3>No bookings found</h3>

                    <p>
                        You haven't made any bookings yet.
                    </p>

                </div>

            ) : (

                <div className="booking-grid">

                    {bookings.map((booking) => (

                        <div
                            className="booking-card"
                            key={booking._id}
                        >

                            <div className="booking-card-header">

                                <h3>
                                    {booking.equipment?.name ||
                                        "Equipment"}
                                </h3>

                                <span
                                    className={`status ${booking.status}`}
                                >
                                    {booking.status}
                                </span>

                            </div>

                            <p className="booking-category">
                                {booking.equipment?.category}
                            </p>

                            <div className="booking-details">

                                <p>
                                    <strong>
                                        User:
                                    </strong>{" "}
                                    {booking.userName}
                                </p>

                                <p>
                                    <strong>
                                        Location:
                                    </strong>{" "}
                                    {booking.equipment
                                        ?.location ||
                                        "N/A"}
                                </p>

                                <p>
                                    <strong>
                                        Start Date:
                                    </strong>{" "}
                                    {new Date(
                                        booking.startDate
                                    ).toLocaleDateString()}
                                </p>

                                <p>
                                    <strong>
                                        End Date:
                                    </strong>{" "}
                                    {new Date(
                                        booking.endDate
                                    ).toLocaleDateString()}
                                </p>

                                <p className="booking-price">

                                    <strong>
                                        Total:
                                    </strong>{" "}

                                    ৳{booking.totalPrice}

                                </p>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </section>
    );
}

export default BookingList;