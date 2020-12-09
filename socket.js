const SocketIO = require("socket.io");
const axios = require("axios");

module.exports = (server, app, sessionMiddleware) => {
  //웹소켓 서버 생성
  const io = SocketIO(server, { path: "/socket.io" });

  app.set("io", io); // 라우터에서 io 객체를 쓸 수 있게 저장. req.app.get('io')로 접근

  // of() : socket.io에 네임스페이스 부여
  // Socket.IO는 기본적으로 / 네임스페이스에 접속. => of 메서드를 사용하면 다른 네임스페이스를 만들어 접속.
  const room = io.of("/room"); 
  const chat = io.of("/chat");
  io.use((socket, next) => { // io.use로 미들웨어 장착. 모든 웹소켓 연결 시 실행됨.
    sessionMiddleware(socket.request, socket.request.res, next);
  }); 

  //  /room 네임스페이스에 연결된 클라이언트에게만 데이터를 보냄
  room.on("connection", (socket) => {
    console.log("room 네임스페이스에 접속");
    socket.on("disconnect", () => {
      console.log("room 네임스페이스 접속 해제");
    });
  });

  chat.on("connection", (socket) => {
    // 웹소켓 객체
    console.log("chat 네임스페이스에 접속");
    const req = socket.request; // 요청 객체에 접근
    const {
      headers: { referer },
    } = req;
    const roomId = referer
      .split("/")[referer.split("/").length - 1]
      .replace(/\?.+/, "");
    
    socket.join(roomId); // 접속 시 join메서드. 방 정보를 인자로 받음.
    socket.to(roomId).emit("join", { // roomId의 방에서 join 이벤트를 발생시키면서 데이터를 보냄
      user: "system",
      chat: `${req.session.color}님이 입장하셨습니다.`,
    });

    socket.on("disconnect", () => {
      // 접속 후 disconnect 이벤트 리스너 등록
      console.log("chat 네임스페이스 접속 해제");
      socket.leave(roomId);
      const currentRoom = socket.adapter.rooms[roomId]; // 현재 방에 참여중인 소켓 정보
      const userCount = currentRoom ? currentRoom.length : 0; // 현재 방의 소켓 개수 확인 (currentRoom이 배열인듯함)
      if (userCount === 0) {
        axios
          .delete(`http://localhost:8005/room/${roomId}`) // DB에서 제거 요청
          .then(() => {
            console.log("방 제거 요청 성공");
          })
          .catch((error) => {
            console.error(error);
          });
      } else { // 남아있는 참여자들에게 퇴장 알림
        socket.to(roomId).emit("exit", {
          user: "system",
          chat: `${req.session.color} 님이 퇴장하셨습니다.`,
        });
      }
    });
  });
};
