const express = require('express')
const cors = require('cors')
const fs = require('fs')

const app = express()
app.use(express.json());
app.use(cors()) // so that app can access

// const bookings = JSON.parse(fs.readFileSync('./server/bookings.json')).map(
//   (bookingRecord) => ({
//     time: Date.parse(bookingRecord.time),
//     duration: bookingRecord.duration,
//     userId: bookingRecord.user_id,
//   }),
// )

app.get('/bookings', (_, res) => {
  const bookings = JSON.parse(fs.readFileSync('./server/bookings.json')).map(
    (bookingRecord) => ({
      time: Date.parse(bookingRecord.time),
      duration: bookingRecord.duration,
      userId: bookingRecord.user_id,
    }),
  )
  res.json(bookings)
})

app.post('/bookings', (req, res) => {
  const data = req.body;
  const file = JSON.parse(fs.readFileSync('./server/bookings.json'));
  const newData = JSON.stringify([...file, ...data]);
  fs.writeFileSync('./server/bookings.json', newData);
  res.send(newData);
})

app.listen(3001)
