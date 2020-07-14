const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accountSchema = new Schema({
  username: {
    type: String,
    required: "Enter a username",
  },

  password: {
    type: String,
    required: "Enter a password",
  },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
