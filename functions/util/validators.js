const { admin, db } = require("./admin")

const isEmail = (email) => {
  const regEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (email.match(regEx)) return true
  else return false
}

const isEmpty = (string) => {
  if (string.trim() === "") return true
  else return false
}

exports.validateSignupData = (data) => {
  let errors = {}

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty"
  } else if (!isEmail(data.email)) {
    errors.email = "Must be a valid email address"
  }

  if (isEmpty(data.password)) errors.password = "Must not be empty"
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords must match"
  if (isEmpty(data.handle)) errors.handle = "Must not be empty"

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

exports.validateLoginData = (user) => {
  let errors = {}

  if (isEmpty(user.email)) errors.email = "Must not be empty"
  if (isEmpty(user.password)) errors.password = "Must not be empty"

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

//Check if user owns data
exports.checkOwnership = async (dataId, owner, collection) => {
  let data
  let userOwnsData
  let error

  console.log(dataId)

  try {
    await db
      .collection(collection)
      .where(admin.firestore.FieldPath.documentId(), "==", dataId)
      .where("host", "==", owner)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          data = null
          userOwnsData = false
        } else {
          snapshot.forEach((snap) => {
            data = snap.data()
          })
          userOwnsData = true
        }
        return
      })
  } catch (err) {
    console.error(err)
    error = err.code
  }

  console.log(userOwnsData)

  return { data, userOwnsData, error }
}
