const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  maxPeople: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  available: { type: Boolean, default: true }
});

module.exports = mongoose.model("Room", roomSchema);