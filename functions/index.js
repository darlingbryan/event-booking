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
const { addSeats, deleteSeat, bookSeat } = require("./handle/seats")

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
app.delete("/seat/:seatId", FBAuth, deleteSeat)
app.put("/event/:eventId/seat/:seatId", bookSeat)

exports.api = functions.region("us-central1").https.onRequest(app)
