const { db, admin } = require("../util/admin")
const { checkOwnership } = require("../util/validators")
const { region } = require("firebase-functions")

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

exports.cancelBookedSeat = async (req, res) => {
  //guessed
}

exports.reassignGuest = async (req, res) => {}
