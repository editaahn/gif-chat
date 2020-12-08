const WebSocket = require("ws");

module.exports = (server) => {
  //웹소켓 서버 생성
  const wss = new WebSocket.Server({ server });

  // 클라이언트와 서버의 웹 소켓 연결 발생에 대한 event listener
  wss.on("connection", (ws, req) => { // ws: 웹소켓 객체
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // client ip를 알아냄

    console.log("새로운 클라이언트 접속", ip);
    ws.on("message", (message) => console.log(message)); // message: client로부터 메시지가 온 경우
    ws.on("error", (error) => console.error(error)); // error: 웹 소켓 연결 중 문제 발생한 경우
    ws.on('close', () => { // close: client와 연결이 끊긴 경우
      console.log('클라이언트 접속 해제', ip);
      clearInterval(ws.interval);
    })

    const interval = setInterval(() => { // 모든 클라이언트에게 메시지 전송
      if (ws.readyState === ws.OPEN) { // readyState가 OPEN 상태인지 확인 ( CONNECTING | OPEN | CLOSING | CLOSE ) 
        ws.send('서버에서 클라이언트로 메시지를 보냅니다.') // 클라이언트 하나에 메시지 보냄
      }
    }, 3000)
    ws.interval = interval;
  });
};
