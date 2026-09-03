import { useEffect, useState } from "react";

function EquipmentList({ onBook }) {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        name: "",
        description: "",
        category: "",
        pricePerDay: "",
        securityDeposit: "",
        condition: "",
        images: "",
        userManual: "",
        safetyInstructions: "",
        rating: 0,
        reviews: "",
        location: "",
        availability: true,
    });

    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [priceSort, setPriceSort] = useState("");

    const [selectedDetails, setSelectedDetails] =
        useState(null);

    // ==============================
    // FETCH EQUIPMENT
    // ==============================

    const fetchEquipment = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/equipment"
            );

            const data = await response.json();

            setEquipment(data);
        } catch (error) {
            console.error(
                "Failed to fetch equipment:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    // ==============================
    // HANDLE FORM CHANGE
    // ==============================

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setForm({
            ...form,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        });
    };

    // ==============================
    // ADD / UPDATE
    // ==============================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingId
                ? `http://localhost:5000/api/equipment/${editingId}`
                : "http://localhost:5000/api/equipment";

            const method = editingId
                ? "PUT"
                : "POST";

            const imageArray = form.images
                .split(",")
                .map((image) =>
                    image.trim()
                )
                .filter(
                    (image) => image !== ""
                );

            const reviewArray = form.reviews
                .split(",")
                .map((review) =>
                    review.trim()
                )
                .filter(
                    (review) => review !== ""
                );

            const response = await fetch(
                url,
                {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        name: form.name,
                        description:
                            form.description,
                        category:
                            form.category,
                        pricePerDay:
                            Number(
                                form.pricePerDay
                            ),
                        securityDeposit:
                            Number(
                                form.securityDeposit
                            ),
                        condition:
                            form.condition,
                        images: imageArray,
                        userManual:
                            form.userManual,
                        safetyInstructions:
                            form.safetyInstructions,
                        rating:
                            Number(
                                form.rating
                            ),
                        reviews:
                            reviewArray,
                        location:
                            form.location,
                        availability:
                            form.availability,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                    "Something went wrong"
                );
                return;
            }

            alert(
                editingId
                    ? "Equipment updated successfully!"
                    : "Equipment added successfully!"
            );

            resetForm();

            fetchEquipment();
        } catch (error) {
            console.error(error);

            alert("Server error");
        }
    };

    // ==============================
    // EDIT
    // ==============================

    const handleEdit = (item) => {
        setEditingId(item._id);

        setForm({
            name: item.name || "",
            description:
                item.description || "",
            category:
                item.category || "",
            pricePerDay:
                item.pricePerDay || "",
            securityDeposit:
                item.securityDeposit || "",
            condition:
                item.condition || "",
            images: item.images
                ? item.images.join(", ")
                : "",
            userManual:
                item.userManual || "",
            safetyInstructions:
                item.safetyInstructions ||
                "",
            rating:
                item.rating || 0,
            reviews: item.reviews
                ? item.reviews.join(", ")
                : "",
            location:
                item.location || "",
            availability:
                item.availability !==
                undefined
                    ? item.availability
                    : true,
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ==============================
    // DELETE
    // ==============================

    const handleDelete = async (id) => {
        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this equipment?"
            );

        if (!confirmDelete) return;

        try {
            const response =
                await fetch(
                    `http://localhost:5000/api/equipment/${id}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                alert(
                    data.message ||
                    "Failed to delete equipment"
                );
                return;
            }

            alert(
                "Equipment deleted successfully!"
            );

            fetchEquipment();
        } catch (error) {
            console.error(error);

            alert("Server error");
        }
    };

    // ==============================
    // RESET FORM
    // ==============================

    const resetForm = () => {
        setEditingId(null);

        setForm({
            name: "",
            description: "",
            category: "",
            pricePerDay: "",
            securityDeposit: "",
            condition: "",
            images: "",
            userManual: "",
            safetyInstructions: "",
            rating: 0,
            reviews: "",
            location: "",
            availability: true,
        });
    };

    const cancelEdit = () => {
        resetForm();
    };

    // ==============================
    // BOOK
    // ==============================

    const handleBook = (item) => {
        if (!item.availability) {
            alert(
                "This equipment is currently unavailable."
            );

            return;
        }

        onBook(item);

        setTimeout(() => {
            document
                .getElementById("bookings")
                ?.scrollIntoView({
                    behavior: "smooth",
                });
        }, 100);
    };

    // ==============================
    // FILTERS
    // ==============================

    const categories = [
        ...new Set(
            equipment.map(
                (item) => item.category
            )
        ),
    ];

    const locations = [
        ...new Set(
            equipment.map(
                (item) => item.location
            )
        ),
    ];

    const filteredEquipment =
        equipment
            .filter((item) =>
                item.name
                    .toLowerCase()
                    .includes(
                        searchTerm.toLowerCase()
                    )
            )
            .filter((item) =>
                categoryFilter
                    ? item.category ===
                      categoryFilter
                    : true
            )
            .filter((item) =>
                locationFilter
                    ? item.location ===
                      locationFilter
                    : true
            )
            .sort((a, b) => {
                if (
                    priceSort ===
                    "lowToHigh"
                ) {
                    return (
                        a.pricePerDay -
                        b.pricePerDay
                    );
                }

                if (
                    priceSort ===
                    "highToLow"
                ) {
                    return (
                        b.pricePerDay -
                        a.pricePerDay
                    );
                }

                return 0;
            });

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("");
        setLocationFilter("");
        setPriceSort("");
    };

    // ==============================
    // LOADING
    // ==============================

    if (loading) {
        return (
            <h2>
                Loading equipment...
            </h2>
        );
    }

    return (
        <div className="equipment-page">

            {/* ====================== */}
            {/* FORM */}
            {/* ====================== */}

            <div className="form-card">

                <h2>
                    {editingId
                        ? "Edit Equipment"
                        : "Add New Equipment"}
                </h2>

                <form
                    onSubmit={handleSubmit}
                >

                    <input
                        type="text"
                        name="name"
                        placeholder="Equipment Name"
                        value={form.name}
                        onChange={
                            handleChange
                        }
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Description"
                        value={
                            form.description
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={
                            form.category
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                    <input
                        type="number"
                        name="pricePerDay"
                        placeholder="Price per Day"
                        value={
                            form.pricePerDay
                        }
                        onChange={
                            handleChange
                        }
                        min="0"
                        required
                    />

                    <input
                        type="number"
                        name="securityDeposit"
                        placeholder="Security Deposit"
                        value={
                            form.securityDeposit
                        }
                        onChange={
                            handleChange
                        }
                        min="0"
                        required
                    />

                    <input
                        type="text"
                        name="condition"
                        placeholder="Condition"
                        value={
                            form.condition
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                    <input
                        type="text"
                        name="images"
                        placeholder="Image URLs (comma separated)"
                        value={
                            form.images
                        }
                        onChange={
                            handleChange
                        }
                    />

                    <textarea
                        name="userManual"
                        placeholder="User Manual / Manual Instructions"
                        value={
                            form.userManual
                        }
                        onChange={
                            handleChange
                        }
                    />

                    <textarea
                        name="safetyInstructions"
                        placeholder="Lender Safety Instructions"
                        value={
                            form.safetyInstructions
                        }
                        onChange={
                            handleChange
                        }
                    />

                    <input
                        type="number"
                        name="rating"
                        placeholder="Rating (0 - 5)"
                        value={
                            form.rating
                        }
                        onChange={
                            handleChange
                        }
                        min="0"
                        max="5"
                        step="0.1"
                    />

                    <textarea
                        name="reviews"
                        placeholder="Reviews (comma separated)"
                        value={
                            form.reviews
                        }
                        onChange={
                            handleChange
                        }
                    />

                    <input
                        type="text"
                        name="location"
                        placeholder="Location"
                        value={
                            form.location
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                    <label className="availability">

                        <input
                            type="checkbox"
                            name="availability"
                            checked={
                                form.availability
                            }
                            onChange={
                                handleChange
                            }
                        />

                        Available

                    </label>

                    <button type="submit">
                        {editingId
                            ? "Update Equipment"
                            : "Add Equipment"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={
                                cancelEdit
                            }
                        >
                            Cancel
                        </button>
                    )}

                </form>
            </div>


            {/* ====================== */}
            {/* CATALOG */}
            {/* ====================== */}

            <h2 className="catalog-title">
                Equipment Catalog
            </h2>


            {/* ====================== */}
            {/* FILTERS */}
            {/* ====================== */}

            <div className="catalog-filters">

                <input
                    type="text"
                    placeholder="🔎 Search equipment..."
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(
                            e.target.value
                        )
                    }
                    className="search-input"
                />

                <select
                    value={
                        categoryFilter
                    }
                    onChange={(e) =>
                        setCategoryFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        All Categories
                    </option>

                    {categories.map(
                        (category) => (
                            <option
                                key={category}
                                value={category}
                            >
                                {category}
                            </option>
                        )
                    )}

                </select>


                <select
                    value={
                        locationFilter
                    }
                    onChange={(e) =>
                        setLocationFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        All Locations
                    </option>

                    {locations.map(
                        (location) => (
                            <option
                                key={location}
                                value={location}
                            >
                                {location}
                            </option>
                        )
                    )}

                </select>


                <select
                    value={priceSort}
                    onChange={(e) =>
                        setPriceSort(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        Sort by Price
                    </option>

                    <option value="lowToHigh">
                        Price: Low → High
                    </option>

                    <option value="highToLow">
                        Price: High → Low
                    </option>

                </select>


                <button
                    type="button"
                    className="clear-filter-button"
                    onClick={
                        clearFilters
                    }
                >
                    Clear Filters
                </button>

            </div>


            {/* ====================== */}
            {/* CARDS */}
            {/* ====================== */}

            {filteredEquipment.length ===
            0 ? (

                <p className="no-results">
                    No equipment found
                    matching your filters.
                </p>

            ) : (

                <div className="equipment-container">

                    {filteredEquipment.map(
                        (item) => (

                            <div
                                className="equipment-card"
                                key={item._id}
                            >

                                {/* IMAGE */}

                                {item.images &&
                                    item.images.length >
                                        0 && (

                                        <img
                                            src={
                                                item.images[0]
                                            }
                                            alt={
                                                item.name
                                            }
                                            className="equipment-image"
                                        />

                                    )}


                                <h3>
                                    {item.name}
                                </h3>

                                <p>
                                    {
                                        item.description
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Category:
                                    </strong>{" "}
                                    {
                                        item.category
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Price:
                                    </strong>{" "}
                                    ৳
                                    {
                                        item.pricePerDay
                                    }
                                    /day
                                </p>

                                <p>
                                    <strong>
                                        Security
                                        Deposit:
                                    </strong>{" "}
                                    ৳
                                    {
                                        item.securityDeposit ||
                                        0
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Condition:
                                    </strong>{" "}
                                    {
                                        item.condition ||
                                        "Not specified"
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Location:
                                    </strong>{" "}
                                    {
                                        item.location
                                    }
                                </p>

                                <p>
                                    <strong>
                                        Availability:
                                    </strong>{" "}

                                    <span
                                        className={
                                            item.availability
                                                ? "available-text"
                                                : "unavailable-text"
                                        }
                                    >
                                        {item.availability
                                            ? "Available"
                                            : "Not Available"}
                                    </span>

                                </p>


                                {/* BUTTONS */}

                                <div className="card-buttons">

                                    <button
                                        className="details-button"
                                        onClick={() =>
                                            setSelectedDetails(
                                                item
                                            )
                                        }
                                    >
                                        👁️ View Details
                                    </button>

                                    <button
                                        className="book-button"
                                        onClick={() =>
                                            handleBook(
                                                item
                                            )
                                        }
                                        disabled={
                                            !item.availability
                                        }
                                    >
                                        📅 Book Now
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleEdit(
                                                item
                                            )
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-button"
                                        onClick={() =>
                                            handleDelete(
                                                item._id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}


            {/* ====================== */}
            {/* DETAILS MODAL */}
            {/* ====================== */}

            {selectedDetails && (

                <div
                    className="details-overlay"
                    onClick={() =>
                        setSelectedDetails(
                            null
                        )
                    }
                >

                    <div
                        className="details-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            className="close-details"
                            onClick={() =>
                                setSelectedDetails(
                                    null
                                )
                            }
                        >
                            ✕
                        </button>


                        {/* IMAGE */}

                        {selectedDetails.images &&
                            selectedDetails.images.length >
                                0 && (

                                <img
                                    src={
                                        selectedDetails
                                            .images[0]
                                    }
                                    alt={
                                        selectedDetails.name
                                    }
                                    className="details-image"
                                />

                            )}


                        <h2>
                            {
                                selectedDetails.name
                            }
                        </h2>


                        <p className="details-description">
                            {
                                selectedDetails.description
                            }
                        </p>


                        <div className="details-info">

                            <p>
                                <strong>
                                    Category:
                                </strong>{" "}
                                {
                                    selectedDetails.category
                                }
                            </p>

                            <p>
                                <strong>
                                    Price:
                                </strong>{" "}
                                ৳
                                {
                                    selectedDetails.pricePerDay
                                }
                                /day
                            </p>

                            <p>
                                <strong>
                                    Security Deposit:
                                </strong>{" "}
                                ৳
                                {
                                    selectedDetails.securityDeposit ||
                                    0
                                }
                            </p>

                            <p>
                                <strong>
                                    Condition:
                                </strong>{" "}
                                {
                                    selectedDetails.condition ||
                                    "Not specified"
                                }
                            </p>

                            <p>
                                <strong>
                                    Location:
                                </strong>{" "}
                                {
                                    selectedDetails.location
                                }
                            </p>

                        </div>


                        {/* MANUAL */}

                        <div className="details-section">

                            <h3>
                                📖 User Manual
                            </h3>

                            <p>
                                {
                                    selectedDetails.userManual ||
                                    "No user manual provided."
                                }
                            </p>

                        </div>


                        {/* SAFETY */}

                        <div className="details-section safety-box">

                            <h3>
                                ⚠️ Safety Instructions
                            </h3>

                            <p>
                                {
                                    selectedDetails.safetyInstructions ||
                                    "No safety instructions provided."
                                }
                            </p>

                        </div>


                        {/* RATING */}

                        <div className="details-section">

                            <h3>
                                ⭐ Rating
                            </h3>

                            <p className="rating-display">

                                ⭐{" "}
                                {
                                    selectedDetails.rating ||
                                    0
                                }
                                /5

                            </p>

                        </div>


                        {/* REVIEWS */}

                        <div className="details-section">

                            <h3>
                                💬 Historical Reviews
                            </h3>

                            {selectedDetails
                                .reviews &&
                            selectedDetails
                                .reviews
                                .length >
                                0 ? (

                                <ul className="reviews-list">

                                    {selectedDetails.reviews.map(
                                        (
                                            review,
                                            index
                                        ) => (

                                            <li
                                                key={
                                                    index
                                                }
                                            >
                                                "{review}"
                                            </li>

                                        )
                                    )}

                                </ul>

                            ) : (

                                <p>
                                    No reviews
                                    available
                                    yet.
                                </p>

                            )}

                        </div>


                        {/* BOOK BUTTON */}

                        <button
                            className="details-book-button"
                            onClick={() => {
                                handleBook(
                                    selectedDetails
                                );

                                setSelectedDetails(
                                    null
                                );
                            }}
                            disabled={
                                !selectedDetails.availability
                            }
                        >
                            📅 Book This Equipment
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default EquipmentList;