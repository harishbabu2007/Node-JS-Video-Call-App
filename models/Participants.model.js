const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ParticipantSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Participants = mongoose.model("Participants", ParticipantSchema);

module.exports = Participants;
