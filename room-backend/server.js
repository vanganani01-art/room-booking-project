const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

console.log("MY SERVER FILE RUNNING 123");

// =======================
// MONGODB CONNECTION
// Local: uses mongodb://127.0.0.1:27017/roomapp
// Online Render: uses process.env.MONGO_URL
// =======================
mongoose
  .connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/roomapp")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// =======================
// ROOM SCHEMA
// =======================
const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  }
});

const Room = mongoose.model("Room", roomSchema);

// =======================
// BOOKING SCHEMA
// =======================
const bookingSchema = new mongoose.Schema({
  bookingId: String,
  roomId: String,
  roomName: String,
  userName: String,
  phoneNumber: String,
  nativePlace: String,
  pincode: String,
  fromDate: String,
  toDate: String,
  numberOfDays: Number,
  totalAmount: Number
});

const Booking = mongoose.model("Booking", bookingSchema);

// =======================
// HELPER FUNCTIONS
// =======================
function calculateDays(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  const difference = end - start;
  const days = difference / (1000 * 60 * 60 * 24);

  return days + 1;
}

function isDateRangeInvalid(fromDate, toDate) {
  if (!fromDate || !toDate) return true;
  return new Date(toDate) < new Date(fromDate);
}

function generateBookingId() {
  return `BK-${Date.now()}`;
}

// =======================
// TEST ROUTES
// =======================
app.get("/", (req, res) => {
  res.send("API is working");
});

app.get("/hello", (req, res) => {
  res.send("hello working");
});

// =======================
// ADMIN LOGIN ONLY
// =======================
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({
      success: true,
      role: "admin",
      name: "Admin"
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid admin username or password"
  });
});

// =======================
// ADD ROOM
// =======================
app.post("/add-room", async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      await Room.insertMany(req.body, { ordered: false });
      return res.send("Multiple rooms added");
    }

    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).send("Room name and price are required");
    }

    const existingRoom = await Room.findOne({ name });

    if (existingRoom) {
      return res.status(400).send("Room already exists");
    }

    const room = new Room({
      name,
      price
    });

    await room.save();

    res.send("Room added successfully");
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return res.status(400).send("Duplicate room found");
    }

    res.status(500).send("Error adding room");
  }
});

// =======================
// UPDATE ROOM PRICE
// =======================
app.put("/update-room-price/:id", async (req, res) => {
  try {
    const roomId = req.params.id;
    const { price } = req.body;

    if (!price || Number(price) <= 0) {
      return res.status(400).send("Valid price is required");
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { price: Number(price) },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).send("Room not found");
    }

    res.send("Room price updated successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error updating room price");
  }
});

// =======================
// DELETE ROOM
// =======================
app.delete("/delete-room/:id", async (req, res) => {
  try {
    const roomId = req.params.id;

    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.status(404).send("Room not found");
    }

    await Booking.deleteMany({ roomId });

    res.send("Room and related bookings deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error deleting room");
  }
});

// =======================
// GET ROOMS
// =======================
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ name: 1 });
    res.json(rooms);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching rooms");
  }
});

// =======================
// GET BOOKINGS
// Supports:
// /bookings
// /bookings?userName=Rohit
// /bookings?phoneNumber=9876543210
// /bookings?bookingId=BK-123
// =======================
app.get("/bookings", async (req, res) => {
  try {
    const { userName, phoneNumber, bookingId } = req.query;

    let filter = {};

    if (userName) {
      filter.userName = userName;
    }

    if (phoneNumber) {
      filter.phoneNumber = phoneNumber;
    }

    if (bookingId) {
      filter.bookingId = bookingId;
    }

    const bookings = await Booking.find(filter).sort({ fromDate: 1 });
    res.json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching bookings");
  }
});

// =======================
// GET BOOKED ROOMS BY DATE
// =======================
app.get("/booked-rooms", async (req, res) => {
  const { fromDate, toDate } = req.query;

  try {
    if (!fromDate || !toDate) {
      return res.json([]);
    }

    if (isDateRangeInvalid(fromDate, toDate)) {
      return res.status(400).send("Invalid dates");
    }

    const bookings = await Booking.find({
      $or: [
        {
          fromDate: { $lte: toDate },
          toDate: { $gte: fromDate }
        }
      ]
    });

    const bookedRoomIds = bookings.map((booking) => booking.roomId);

    res.json(bookedRoomIds);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching booked rooms");
  }
});

// =======================
// BOOK ROOM
// =======================
app.post("/book-room", async (req, res) => {
  const {
    roomId,
    fromDate,
    toDate,
    userName,
    phoneNumber,
    nativePlace,
    pincode
  } = req.body;

  try {
    if (
      !roomId ||
      !fromDate ||
      !toDate ||
      !userName ||
      !phoneNumber ||
      !nativePlace ||
      !pincode
    ) {
      return res.status(400).send("Missing booking details");
    }

    if (phoneNumber.length !== 10) {
      return res.status(400).send("Phone number must be 10 digits");
    }

    if (pincode.length !== 6) {
      return res.status(400).send("Pincode must be 6 digits");
    }

    if (isDateRangeInvalid(fromDate, toDate)) {
      return res.status(400).send("Invalid dates");
    }

    const numberOfDays = calculateDays(fromDate, toDate);

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).send("Room not found");
    }

    const existingBooking = await Booking.findOne({
      roomId,
      $or: [
        {
          fromDate: { $lte: toDate },
          toDate: { $gte: fromDate }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).send("Room already booked for selected dates");
    }

    const totalAmount = room.price * numberOfDays;
    const bookingId = generateBookingId();

    const booking = new Booking({
      bookingId,
      roomId,
      roomName: room.name,
      userName,
      phoneNumber,
      nativePlace,
      pincode,
      fromDate,
      toDate,
      numberOfDays,
      totalAmount
    });

    await booking.save();

    res.send(`Room booked successfully. Booking ID: ${bookingId}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error booking room");
  }
});

// =======================
// CANCEL BOOKING
// =======================
app.delete("/cancel-booking/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).send("Booking not found");
    }

    res.send("Booking cancelled successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error cancelling booking");
  }
});

// =======================
// START SERVER
// Local: 5000
// Render: process.env.PORT
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});