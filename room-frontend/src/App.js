import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookedRoomIds, setBookedRoomIds] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nativePlace, setNativePlace] = useState("");
  const [pincode, setPincode] = useState("");

  const [myBookingName, setMyBookingName] = useState("");
  const [myBookingPhone, setMyBookingPhone] = useState("");
  const [myBookingId, setMyBookingId] = useState("");
  const [myBookings, setMyBookings] = useState([]);

  const [searchRoom, setSearchRoom] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [globalFromDate, setGlobalFromDate] = useState("");
  const [globalToDate, setGlobalToDate] = useState("");

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrice, setNewRoomPrice] = useState("");

  const [editingRoom, setEditingRoom] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const adminLogin = async () => {
    if (!adminUsername.trim() || !adminPassword.trim()) {
      alert("Enter admin username and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminUsername("");
        setAdminPassword("");
        fetchBookings();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const adminLogout = () => {
    setIsAdmin(false);
  };

  const fetchRooms = () => {
    fetch("http://localhost:5000/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.log(err));
  };

  const fetchBookings = () => {
    fetch("http://localhost:5000/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch((err) => console.log(err));
  };

  const fetchMyBookings = () => {
    let url = "http://localhost:5000/bookings";

    if (myBookingPhone.trim()) {
      url += `?phoneNumber=${myBookingPhone.trim()}`;
    } else if (myBookingId.trim()) {
      url += `?bookingId=${myBookingId.trim()}`;
    } else if (myBookingName.trim()) {
      url += `?userName=${myBookingName.trim()}`;
    } else {
      alert("Enter phone number, booking ID, or booking name");
      return;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setMyBookings(data))
      .catch((err) => console.log(err));
  };

  const fetchBookedRoomsByDate = () => {
    if (!globalFromDate || !globalToDate) {
      setBookedRoomIds([]);
      return;
    }

    fetch(
      `http://localhost:5000/booked-rooms?fromDate=${globalFromDate}&toDate=${globalToDate}`
    )
      .then((res) => res.json())
      .then((data) => setBookedRoomIds(data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookedRoomsByDate();
  }, [globalFromDate, globalToDate]);

  const calculateDays = () => {
    if (!globalFromDate || !globalToDate) return 0;

    const start = new Date(globalFromDate);
    const end = new Date(globalToDate);

    const difference = end - start;
    const days = difference / (1000 * 60 * 60 * 24);

    return days + 1;
  };

  const isRoomBookedForSelectedDates = (roomId) => {
    return bookedRoomIds.includes(roomId);
  };

  const getFilteredRooms = () => {
    return rooms.filter((room) => {
      const matchesRoom =
        searchRoom.trim() === "" ||
        room.name.toLowerCase().includes(searchRoom.toLowerCase());

      const matchesPrice = maxPrice === "" || room.price <= Number(maxPrice);

      return matchesRoom && matchesPrice;
    });
  };

  const shareOnWhatsApp = (booking) => {
    if (!booking.phoneNumber) {
      alert("Phone number not available for this booking");
      return;
    }

    const cleanPhone = booking.phoneNumber.toString().replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      alert("Invalid phone number for WhatsApp");
      return;
    }

    const message = `Room Booking Details

Booking ID: ${booking.bookingId || "Old booking"}
Room: ${booking.roomName || booking.roomId}
Customer Name: ${booking.userName}
Phone: ${booking.phoneNumber}
Native Place: ${booking.nativePlace || ""}
Pincode: ${booking.pincode || ""}
Dates: ${booking.fromDate} to ${booking.toDate}
Days: ${booking.numberOfDays || 1}
Total Amount: Rs.${booking.totalAmount}

Thank you for booking with us.`;

    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const addRoom = async () => {
    if (!isAdmin) {
      alert("Only admin can add rooms");
      return;
    }

    if (!newRoomName.trim()) {
      alert("Enter room number");
      return;
    }

    if (!newRoomPrice || Number(newRoomPrice) <= 0) {
      alert("Enter valid room price");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/add-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newRoomName.trim(),
          price: Number(newRoomPrice)
        })
      });

      const data = await res.text();
      alert(data);

      if (data === "Room added successfully") {
        setNewRoomName("");
        setNewRoomPrice("");
        fetchRooms();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const startEditingPrice = (room) => {
    setEditingRoom(room);
    setEditPrice(room.price);
  };

  const updateRoomPrice = async () => {
    if (!editPrice || Number(editPrice) <= 0) {
      alert("Enter valid price");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/update-room-price/${editingRoom._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            price: Number(editPrice)
          })
        }
      );

      const data = await res.text();
      alert(data);

      if (data === "Room price updated successfully") {
        setEditingRoom(null);
        setEditPrice("");
        fetchRooms();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRoom = async (roomId, roomName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Room ${roomName}? Related bookings will also be deleted.`
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/delete-room/${roomId}`, {
        method: "DELETE"
      });

      const data = await res.text();
      alert(data);

      if (data === "Room and related bookings deleted successfully") {
        fetchRooms();
        fetchBookings();
        fetchBookedRoomsByDate();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openBookingModal = (room) => {
    if (!globalFromDate || !globalToDate) {
      alert("Please select From Date and To Date first");
      return;
    }

    if (globalToDate < globalFromDate) {
      alert("To Date cannot be before From Date");
      return;
    }

    if (isRoomBookedForSelectedDates(room._id)) {
      alert("Room already booked for selected dates");
      return;
    }

    setSelectedRoom(room);
  };

  const bookRoom = async () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    if (phoneNumber.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }

    if (!nativePlace.trim()) {
      alert("Please enter native place");
      return;
    }

    if (pincode.length !== 6) {
      alert("Pincode must be 6 digits");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/book-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: selectedRoom._id,
          userName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          nativePlace: nativePlace.trim(),
          pincode: pincode.trim(),
          fromDate: globalFromDate,
          toDate: globalToDate
        })
      });

      const data = await res.text();
      alert(data);

      if (data.startsWith("Room booked successfully")) {
        setSelectedRoom(null);
        setMyBookingName(customerName.trim());
        setMyBookingPhone(phoneNumber.trim());
        setCustomerName("");
        setPhoneNumber("");
        setNativePlace("");
        setPincode("");
        fetchBookings();
        fetchBookedRoomsByDate();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const cancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) return;

    try {
      const res = await fetch(
        `http://localhost:5000/cancel-booking/${bookingId}`,
        {
          method: "DELETE"
        }
      );

      const data = await res.text();
      alert(data);

      if (data === "Booking cancelled successfully") {
        fetchBookings();
        fetchMyBookings();
        fetchBookedRoomsByDate();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const days = calculateDays();
  const previewTotal =
    selectedRoom && days > 0 ? selectedRoom.price * days : 0;

  const filteredRooms = getFilteredRooms();

  const totalRooms = rooms.length;
  const bookedForSelectedDates = bookedRoomIds.length;
  const availableForSelectedDates =
    globalFromDate && globalToDate
      ? totalRooms - bookedForSelectedDates
      : totalRooms;
  const totalBookings = bookings.length;

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>🏨 Room Booking App</h1>
          <p>
            {isAdmin
              ? "Admin mode enabled"
              : "Public booking mode - no user login required"}
          </p>
        </div>

        {isAdmin ? (
          <button className="logout-btn" onClick={adminLogout}>
            Admin Logout
          </button>
        ) : (
          <button
            className="logout-btn"
            onClick={() => setShowAdminLogin(true)}
          >
            Admin Login
          </button>
        )}
      </div>

      {showAdminLogin && !isAdmin && (
        <div className="admin-panel">
          <h2>🔐 Admin Login</h2>

          <div className="admin-form">
            <input
              type="text"
              placeholder="Admin username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />

            <button onClick={adminLogin}>Login</button>

            <button
              className="clear-btn"
              onClick={() => setShowAdminLogin(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="dashboard">
        <div className="dashboard-card">
          <h3>{totalRooms}</h3>
          <p>Total Rooms</p>
        </div>

        <div className="dashboard-card">
          <h3>{bookedForSelectedDates}</h3>
          <p>Booked for Selected Dates</p>
        </div>

        <div className="dashboard-card">
          <h3>{availableForSelectedDates}</h3>
          <p>Available for Selected Dates</p>
        </div>

        {isAdmin && (
          <div className="dashboard-card">
            <h3>{totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="admin-panel">
          <h2>➕ Add New Room</h2>

          <div className="admin-form">
            <input
              type="text"
              placeholder="Room number e.g. 401"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />

            <input
              type="number"
              placeholder="Price per day"
              value={newRoomPrice}
              onChange={(e) => setNewRoomPrice(e.target.value)}
            />

            <button onClick={addRoom}>Add Room</button>
          </div>
        </div>
      )}

      <div className="filters">
        <input
          type="date"
          value={globalFromDate}
          onChange={(e) => setGlobalFromDate(e.target.value)}
        />

        <input
          type="date"
          value={globalToDate}
          onChange={(e) => setGlobalToDate(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search room number"
          value={searchRoom}
          onChange={(e) => setSearchRoom(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <button
          className="clear-btn"
          onClick={() => {
            setSearchRoom("");
            setMaxPrice("");
            setGlobalFromDate("");
            setGlobalToDate("");
            setBookedRoomIds([]);
          }}
        >
          Clear Filters
        </button>
      </div>

      {globalFromDate && globalToDate && days > 0 && (
        <div className="summary-box">
          Selected Stay: {globalFromDate} → {globalToDate} | Days: {days}
        </div>
      )}

      {[1, 2, 3, 4, 5].map((floor) => {
        const floorRooms = filteredRooms.filter((room) =>
          room.name.startsWith(floor.toString())
        );

        if (floorRooms.length === 0) return null;

        return (
          <div className="floor-section" key={floor}>
            <h2 className="floor-title">Floor {floor}</h2>

            <div className="room-grid">
              {floorRooms.map((room) => {
                const booked = isRoomBookedForSelectedDates(room._id);

                return (
                  <div className="room-card" key={room._id}>
                    <h3>Room {room.name}</h3>
                    <p className="price">₹{room.price} / day</p>

                    {booked ? (
                      <button className="booked-btn">Booked</button>
                    ) : (
                      <button
                        className="book-btn"
                        onClick={() => openBookingModal(room)}
                      >
                        Book Now
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          className="edit-price-btn"
                          onClick={() => startEditingPrice(room)}
                        >
                          Edit Price
                        </button>

                        <button
                          className="delete-room-btn"
                          onClick={() => deleteRoom(room._id, room.name)}
                        >
                          Delete Room
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedRoom && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Book Room {selectedRoom.name}</h2>
            <p>Price: ₹{selectedRoom.price} / day</p>
            <p>
              Dates: {globalFromDate} → {globalToDate}
            </p>

            <label>Customer Name</label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <label>Phone Number</label>
            <input
              type="number"
              placeholder="Enter 10-digit phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <label>Native Place</label>
            <input
              type="text"
              placeholder="Enter native place"
              value={nativePlace}
              onChange={(e) => setNativePlace(e.target.value)}
            />

            <label>Pincode</label>
            <input
              type="number"
              placeholder="Enter 6-digit pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />

            {days > 0 && (
              <div className="booking-preview">
                <p>Days: {days}</p>
                <p>Total: ₹{previewTotal}</p>
              </div>
            )}

            <div className="modal-actions">
              <button className="confirm-btn" onClick={bookRoom}>
                Confirm
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setSelectedRoom(null);
                  setCustomerName("");
                  setPhoneNumber("");
                  setNativePlace("");
                  setPincode("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRoom && isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Price - Room {editingRoom.name}</h2>

            <label>New Price</label>
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />

            <div className="modal-actions">
              <button className="confirm-btn" onClick={updateRoomPrice}>
                Update
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setEditingRoom(null);
                  setEditPrice("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="history">
          <h2>📋 My Bookings</h2>

          <div className="filters">
            <input
              type="text"
              placeholder="Enter booking name"
              value={myBookingName}
              onChange={(e) => setMyBookingName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Enter phone number"
              value={myBookingPhone}
              onChange={(e) => setMyBookingPhone(e.target.value)}
            />

            <input
              type="text"
              placeholder="Enter booking ID"
              value={myBookingId}
              onChange={(e) => setMyBookingId(e.target.value)}
            />

            <button className="book-btn" onClick={fetchMyBookings}>
              View My Bookings
            </button>
          </div>

          {myBookings.length === 0 ? (
            <p>No bookings found</p>
          ) : (
            myBookings.map((booking) => (
              <div className="booking-card" key={booking._id}>
                <p>
                  <strong>Booking ID:</strong>{" "}
                  {booking.bookingId || "Old booking"}
                </p>
                <strong>Room {booking.roomName || booking.roomId}</strong>
                <p>Customer Name: {booking.userName}</p>
                <p>Phone: {booking.phoneNumber}</p>
                <p>Native Place: {booking.nativePlace}</p>
                <p>Pincode: {booking.pincode}</p>
                <p>
                  Dates: {booking.fromDate} → {booking.toDate}
                </p>
                <p>Days: {booking.numberOfDays || 1}</p>
                <p>Total: ₹{booking.totalAmount}</p>

                <button
                  className="whatsapp-btn"
                  onClick={() => shareOnWhatsApp(booking)}
                >
                  Share on WhatsApp
                </button>

                <button
                  className="cancel-booking-btn"
                  onClick={() => cancelBooking(booking._id)}
                >
                  Cancel My Booking
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {isAdmin && (
        <div className="history">
          <h2>📋 All Booking History</h2>

          {bookings.length === 0 ? (
            <p>No bookings yet</p>
          ) : (
            bookings.map((booking) => (
              <div className="booking-card" key={booking._id}>
                <p>
                  <strong>Booking ID:</strong>{" "}
                  {booking.bookingId || "Old booking"}
                </p>
                <strong>Room {booking.roomName || booking.roomId}</strong>
                <p>Customer Name: {booking.userName}</p>
                <p>Phone: {booking.phoneNumber}</p>
                <p>Native Place: {booking.nativePlace}</p>
                <p>Pincode: {booking.pincode}</p>
                <p>
                  Dates: {booking.fromDate} → {booking.toDate}
                </p>
                <p>Days: {booking.numberOfDays || 1}</p>
                <p>Total: ₹{booking.totalAmount}</p>

                <button
                  className="whatsapp-btn"
                  onClick={() => shareOnWhatsApp(booking)}
                >
                  Share on WhatsApp
                </button>

                <button
                  className="cancel-booking-btn"
                  onClick={() => cancelBooking(booking._id)}
                >
                  Cancel Booking
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;