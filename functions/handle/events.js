const { db, admin } = require("../util/admin")
const { checkOwnership } = require("../util/validators")

//Create events
exports.createEvent = async (req, res) => {
  const newEventDetails = {
    host: req.user.handle,
    title: req.body.title,
    location: req.body.location,
    time: req.body.time,
    status: req.body.status,
    passcode: req.body.passcode,
    flooreplan: req.body.floorplan,
    description: req.body.description,
    guidelines: req.body.guidelines,
    totalSeats: 0,
    seats: [],
  }

  try {
    const newEvent = await db.collection("events").add(newEventDetails)

    return res.status(201).json(newEventDetails)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Delete event
exports.deleteEvent = async (req, res) => {
  const eventId = req.params.eventId

  try {
    //check if user owns event
    const { data, userOwnsData, error } = await checkOwnership(
      req.params.eventId,
      req.user.handle,
      "events"
    )

    if (error) return res.status(500).json({ error: error })
    if (!userOwnsData) return res.json({ error: "Event not found." })

    const batch = db.batch()

    const eventRef = db.doc(`events/${eventId}`)
    batch.delete(eventRef)

    await db
      .collection("seats")
      .where("eventId", "==", eventId)
      .get()
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          batch.delete(doc.ref)
        })
        return res.status(200).json({ message: "Event deleted." })
      })

    return batch.commit()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

//Edit event
exports.updateEvent = async (req, res) => {
  const eventId = req.params.eventId

  try {
    //check if user owns event
    const { data, userOwnsData, error } = await checkOwnership(
      req.params.eventId,
      req.user.handle,
      "events"
    )

    if (error) return res.status(500).json({ error: error })
    if (!userOwnsData) return res.json({ error: "Event not found." })

    const event = await db.doc(`/events/${req.params.eventId}`).update({
      title: req.body.title,
      location: req.body.location,
      time: req.body.time,
      status: req.body.status,
      passcode: req.body.passcode,
      flooreplan: req.body.floorplan,
      description: req.body.description,
      guidelines: req.body.guidelines,
      totalSeats: 0,
    })

    return res.status(200).json({ event })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}

exports.getEvent = async (req, res) => {
  const eventId = req.params.eventId

  try {
    const doc = await db.collection("events").doc(eventId).get()

    if (!doc.exists) return res.json({ error: "Event not found." })

    const event = doc.data()

    return res.status(200).json({ event })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.code })
  }
}
