const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const fs = require("fs");
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();
const mongoclient = mongodb.MongoClient;
const DB_URL =
  "mongodb+srv://sarvesh:sarvesh@cluster0.9ltte.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" ||
  "mongodb://127.0.0.1:27017";
const port = process.env.PORT || 8080;
const bikebooklist = JSON.parse(
  fs.readFileSync("bikebooklist.json", "utf-8", (err, data) => {
    console.log(data);
  })
);

app.get("/bike", (req, res) => {
  res.json(bikebooklist);
});

app.post("/availability", async (req, res) => {
  try {
    const client = await mongoclient.connect(DB_URL);
    const db = client.db("BikeRental");

    let result = await db.collection("bookingbike").findOne({
      $and: [
        { bike: req.body.bike },
        { fromdate: { $lte: req.body.todate } },
        { fromtime: { $lte: req.body.totime } },
        { todate: { $gte: req.body.fromdate } },
        { totime: { $gte: req.body.fromtime } },
      ],
    });
    if (result) {
      res.json({
        message: "Bike booked. not available",
      });
    } else {
      res.status(200).json({ message: "Bike Available" });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  } finally {
    client.close();
  }
});

app.post("/book", async (req, res) => {
  try {
    const client = await mongoclient.connect(DB_URL);
    const db = client.db("BikeRental");
    const data = {
      bike: req.body.bike,
      fromdate: req.body.fromdate,
      fromtime: req.body.fromtime,
      todate: req.body.todate,
      totime: req.body.totime,
    };
    const datas = {
      name: req.body.name,
      email: req.body.email,
      DLNO: req.body.licenseno,
      bike: req.body.bike,
      fromdate: req.body.fromdate,
      fromtime: req.body.fromtime,
      todate: req.body.todate,
      totime: req.body.totime,
    };
    await db.collection("bookingbike").insertOne(datas);
    bikebooklist.push(data);
    fs.writeFileSync("bikebooklist.json", JSON.stringify(bikebooklist));
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sarveshlalacc2@gmail.com",
        pass: "Sarvesh@05",
      },
    });
    var mailOptions = {
      from: "sarveshlal@gmail.com",
      to: req.body.email,
      subject: "Activation Link",
      html: `
          <h2>This is the confirmation Mail</h2>
          <h3>Thank you for Booking in Pro Rental Bikes.</h3>
          <p>Your <b>Bike</b> : ${req.body.bike} renting from ${req.body.fromdate} to ${req.body.todate} is booked</p>
          <p>Please pick up at our station..</p>
          <h4>Thank You</h4>
        `,
    };
    transporter.sendMail(mailOptions, function (err, data) {
      if (err) console.log(err);
      else console.log("Email sent: " + data.response);
    });
    res.status(200).json({
      message: "Bike is successfully Booked. Please pick up at our station",
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  } finally {
    client.close();
  }
});
app.listen(port, () => {
  console.log(`server running: ${port}`);
});
