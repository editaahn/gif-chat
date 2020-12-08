const SocketIO = require('socket.io')

module.exports = (server) => {
  //웹소켓 서버 생성
  const io = SocketIO(server, { path: '/socket.io' });

  // 클라이언트와 서버의 웹 소켓 연결 발생에 대한 event listener
  io.on("connection", (socket) => { // 웹소켓 객체
    const req = socket.request; // 요청 객체에 접근
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // client ip를 알아냄

    console.log("새로운 클라이언트 접속", ip, socket.id, req.ip); // socket.id로 소켓의 주인 식별

    socket.on("error", (error) => console.error(error)); // error: 웹 소켓 연결 중 문제 발생한 경우
    socket.on('disconnect', () => { // close: client와 연결이 끊긴 경우
      console.log('클라이언트 접속 해제', ip, socket.id);
      clearInterval(socket.interval);
    })
    socket.on("reply", (data) => console.log(data)); // reply: 사용자 정의 이벤트. 클라이언트에서 reply라는 이벤트명으로 데이터를 보내는 지 listen

    socket.interval = setInterval(() => { // 모든 클라이언트에게 메시지 전송
      socket.emit('news', 'Hello Socket.IO') // 첫번째 인자는 이벤트이름, 두번째는 전달할 데이터
    }, 3000)
  });
};
