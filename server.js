const express = require("express");
const dotenv = require('dotenv').config();

const cors = require("cors");
const app = express();


var corsOptions = {
  origin: '*', // Allow all origins
};

app.use(cors(corsOptions));

const morgan = require('morgan');
app.use(morgan('dev'));


// parse requests of content-type - application/json
app.use(express.json());  /* bodyParser.json() is deprecated */

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));   /* bodyParser.urlencoded() is deprecated */

const db = require('./Model/dbConnection');
db.sequelize.sync();

// // drop the table if it already exists
// db.sequelize.sync({ force: true }).then(() => {ht
//   console.log("Drop and re-sync db.");
// });


// simple route
app.get("/", (req, res) => {
  res.json({ message: "CodeX : server is running" });
});


const authRoutes = require("./Routes/auth.routes");
const userRoutes = require("./Routes/user.routes");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);




// set port, listen for requests
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
