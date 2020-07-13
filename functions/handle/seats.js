const { db, admin } = require("../util/admin")
const { checkOwnership } = require("../util/validators")

//Add seats
exports.addSeats = async (req, res) => {
  const eventId = req.params.eventId
  const owner = req.user.handle
  const seatsToAdd = req.body.seatsToAdd

  try {
    //check if user owns event
    const { data, userOwnsData, error } = await checkOwnership(
      req.params.eventId,
      req.user.handle,
      "events"
    )

    if (error) return res.status(500).json({ error: error })
    if (!userOwnsData) return res.json({ error: "Event not found." })

    //transaction
    const eventRef = db.collection("events").doc(eventId)

    await db.runTransaction(async (t) => {
      const event = await t.get(eventRef)

      const existingSeats = event.data().totalSeats

      //createSeats
      for (i = 0; i < seatsToAdd; i++) {
        const seatDetails = {
          eventId,
          host: event.data().host,
          seatNumber: existingSeats + i,
          guest: "",
          email: "",
          phone: "",
        }

        const newSeatRef = db.collection("seats").doc()
        t.set(newSeatRef, seatDetails)

        t.update(eventRef, {
          seats: admin.firestore.FieldValue.arrayUnion(newSeatRef.id),
        })
      }

      //add seatsIds to event
      t.update(eventRef, {
        totalSeats: existingSeats + seatsToAdd,
      })
    })

    return res.status(201).json(eventRef)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//seats will be deleted individually
exports.deleteSeat = async (req, res) => {
  const seatId = req.params.seatId
  const owner = req.user.handle

  //check if user owns event
  const { data, userOwnsData, error } = await checkOwnership(
    seatId,
    owner,
    "seats"
  )

  if (error) return res.status(500).json({ error: error })
  if (!userOwnsData) return res.json({ error: "Seat not found." })

  const seatRef = db.collection("seats").doc(seatId)

  try {
    await db.runTransaction(async (t) => {
      const seat = await t.get(seatRef)
      const eventId = seat.data().eventId
      const eventRef = db.collection("events").doc(eventId)

      t.delete(seatRef)
      t.update(eventRef, {
        seats: admin.firestore.FieldValue.arrayRemove(seatId),
      })
    })

    return res.status(200).json({ message: "Seat deleted" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}
//bookSeat by guest
exports.bookSeat = async (req, res) => {
  const seatId = req.params.seatId
  const eventId = req.params.eventId

  const guessPasscode = req.body.passcode

  const guestDetails = {
    guest: req.body.guest,
    email: req.body.email,
    phone: req.body.phone,
  }

  const seatRef = db.collection("seats").doc(seatId)
  const eventRef = db.collection("events").doc(eventId)

  try {
    const event = await eventRef.get()
    const passcode = event.data().passcode

    if (passcode !== "" && passcode !== guessPasscode)
      return res.status(401).json({ message: "Passcode is wrong" })

    await seatRef.update(guestDetails)

    return res.status(200).json({ message: "Seat booked." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//cancel booking by guest
exports.cancelBooking = async (req, res) => {
  //check seat ownership
  const seatId = req.params.seatId
  const email = req.body.email

  const seatRef = db.collection("seats").doc(seatId)

  try {
    const seat = await seatRef.get()
    const seatEmail = seat.data().email

    if (email !== seatEmail)
      return res.status(400).json({ message: "The registered email is wrong." })

    seatRef.update({
      guest: "",
      email: "",
      phone: "",
    })

    return res.status(200).json({ message: "Booking canceled." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//host update seat
exports.updateSeat = async (req, res) => {
  const eventId = req.params.eventId
  const seatId = req.params.seatId
  const owner = req.user.handle

  newUpdates = {
    guest: req.body.guest,
    email: req.body.email,
    phone: req.body.phone,
  }

  const { data, userOwnsData, error } = await checkOwnership(
    seatId,
    owner,
    "seats"
  )

  if (error) return res.status(500).json({ error: error })
  if (!userOwnsData) return res.json({ error: "Seat not found." })

  const seatRef = db.collection("seats").doc(seatId)

  try {
    await seatRef.update({
      guest: req.body.guest,
      email: req.body.email,
      phone: req.body.phone,
    })

    return res.status(200).json({ message: "Seat updated." })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}
