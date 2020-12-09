const express = require("express");

const Room = require("../schemas/room");

const router = express.Router();

router.get("/", async (req, res, next) => {
  // 메인 화면 렌더링. 채팅방 목록 보여줌
  try {
    const rooms = await Room.find({});
    res.render("main", {
      rooms,
      title: "GIF 채팅방",
      error: req.flash("roomError"),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
