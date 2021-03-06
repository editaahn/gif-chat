const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Room = require("../schemas/room");
const Chat = require("../schemas/chat");

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

router.get("/room", (req, res) => {
  // 채팅방 생성 화면 렌더링
  res.render("room", { title: "GIF 채팅방 생성" });
});

router.post("/room", async (req, res, next) => {
  // room 생성 요청 시
  try {
    const room = new Room({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
    });
    const newRoom = await room.save(); // DB 저장
    const io = req.app.get("io"); // io 객체 가져오기
    io.of("/room").emit("newRoom", newRoom); // /room 네임스페이스에 연결된 모든 클라이언트에게 새로운 room에 대한 데이터를 보냄
    res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get("/room/:id", async (req, res, next) => {
  // 채팅방 렌더링
  try {
    const room = await Room.findOne({ _id: req.params.id });
    const io = req.app.get("io");

    if (!room) {
      req.flash("roomError", "존재하지 않는 방입니다.");
      return res.redirect("/");
    }

    // 비밀번호를 요구하는 방이고, 방의 비밀번호가 쿼리로 보낸 비밀번호와 다르다면,
    if (room.password && room.password !== req.query.password) {
      req.flash("roomError", "비밀번호가 틀렸습니다");
      return res.redirect("/");
    }

    const { rooms } = io.of("/chat").adapter; // 방 전체 정보

    // 방이 1개이상 존재하고 && rooms[id] : id와 일치하는 key(방)이 있는지 확인 && 일치하는 방의 현재 소켓수가 최대수용인원보다 같거나 크면
    if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
      req.flash("roomError", "허용 인원을 초과하였습니다.");
      return res.redirect("/");
    }

    const chats = await Chat.find({ room: room._id}).sort('createdAt');
    
    return res.render('chat', {
      room,
      title: room.title,
      chats, // 채팅 렌더링
      user: req.session.color,
    })

  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/room/:id', async (req, res, next) => { // delete 메서드로 요청이 오면
  try {
    await Room.remove({ _id: req.params.id });
    await Chat.remove({ room: req.params.id });
    res.send('ok');
    setTimeout(() => { // 2초 후에 
      req.app.get('io').of('/room').emit('removeRoom', req.params.id);
    }, 2000)
  } catch (error) {
    console.error(error);
    next(error);
  }
})

router.post("/room/:id/chat", async (req, res, next) => {
  try {
    const chat = new Chat({
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });
    await chat.save();
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat); // /chat 네임스페이스 및 방번호에 있는 소켓 전체에 chat을 보냄
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// uploads 폴더가 없는 경우 폴더 생성
fs.readdir("uploads", (error) => {
  if (error) {
    console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
    fs.mkdirSync("uploads");
  }
});

const upload = multer({
  storage: multer.diskStorage({
    // 저장경로
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    // 파일명 지정
    filename(req, file, cb) {
      const ext = path.extname(file.originalname); // 확장자
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/room/:id/gif", upload.single("gif"), async (req, res, next) => {
  try {
    const chat = new Chat({
      room: req.params.id,
      user: req.session.color,
      gif: req.file.filename,
    });
    await chat.save();
    req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat); // /chat 네임스페이스 및 방번호에 있는 소켓 전체에 chat을 보냄
    res.send("ok");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
