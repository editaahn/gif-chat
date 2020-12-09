const mongoose = require("mongoose");

const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const chatSchema = new Schema({
  room: { // 채팅방 아이디
    type: ObjectId,
    required: true,
    ref: "Room",
  },
  user: { // 채팅한 유저
    type: String,
    required: true,
  },
  chat: String, // 채팅 내역
  gif: String, // gif 주소
  createdAt: { // 채팅 시간
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Chat', chatSchema);
