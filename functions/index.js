const functions = require("firebase-functions")
const app = require("express")()
const cors = require("cors")
app.use(cors())

const { signup, login, getUserDetails } = require("./handle/users")
const {
  createEvent,
  deleteEvent,
  updateEvent,
  getEvent,
} = require("./handle/events")
const {
  addSeats,
  deleteSeat,
  bookSeat,
  cancelBooking,
  updateSeat,
} = require("./handle/seats")

const { FBAuth } = require("./util/FBAuth")

//User routes
app.post("/signup", signup)
app.post("/login", login)
app.get("/user", FBAuth, getUserDetails)

//Event Routes
app.post("/event", FBAuth, createEvent)
app.delete("/event/:eventId", FBAuth, deleteEvent)
app.put("/event/:eventId", FBAuth, updateEvent)
app.get("/event/:eventId", getEvent)

//Seat Routes
app.post("/event/:eventId", FBAuth, addSeats)
app.delete("/event/:eventId/seat/:seatId", FBAuth, deleteSeat)
app.put("/event/:eventId/seat/:seatId", FBAuth, updateSeat)
app.put("/guest/event/:eventId/seat/:seatId", bookSeat)
app.post("/guest/event/:eventId/seat/:seatId", cancelBooking)

exports.api = functions.region("us-central1").https.onRequest(app)
