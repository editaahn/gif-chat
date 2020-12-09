const mongoose = require("mongoose");

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;

module.exports = () => {
  const connect = () => {
    if (NODE_ENV !== "production") {
      // 개발환경일 때만 콘솔에서 mongoose 생성 쿼리를 확인
      mongoose.set("debug", true);
    }

    mongoose.connect(
      MONGO_URL,
      {
        dbName: "gifchat", // 커넥션할 db이름
      },
      (error) => {
        if (error) {
          console.log("몽고디비 연결 에러", error);
        } else {
          console.log("몽고디비 연결 성공");
        }
      }
    );
  };

  connect();

  mongoose.connection.on("error", (error) => {
    // 커넥션에 이벤트 리스너. 에러 시
    console.error("몽고디비 연결 에러", error);
  });
  mongoose.connection.on("disconnected", () => {
    console.error("몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.");
    connect();
  });

  //schema 연결
  require('./chat')
  require('./room')

};
