let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/My_Game", {
  useNewUrlParser: true,
  useFindAndModify: false,
});

let accountSeed = [
  {
    username: "alcal",
    password: "1234",
  },
  {
    username: "unicornwar",
    password: "1234",
  },
  {
    username: "tycol",
    password: "1234",
  },
];

db.Account.deleteMany({})
  .then(() => db.Account.collection.insertMany(accountSeed))
  .then((data) => {
    console.log(data.result.n + " records inserted!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
