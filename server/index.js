const { v4: uuidv4 } = require("uuid");
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app).listen(3001);
const io = require("socket.io")(server, { cors: { origin: "*" } });

let userRoom = new Map(),
  globalUsers = {},
  globalSocketUsers = {},
  creater = {};

console.log("Start server");

io.on("connection", (socket) => {
  console.log("connect!");
  const userid = String(socket.handshake.query.userid) || uuidv4();

  //Отдаем пользователю id & socket.id
  socket.emit("set-user", {
    socket: socket.id,
    id: userid,
  });

  //Устанавливаем пустое значение для пользователя
  globalUsers[userid] = {
    socket: socket.id,
    room: false,
  };
  globalSocketUsers[socket.id] = userid;

  //Событие создание комнаты
  socket.on("create-room", (userid) => {
    let key = uuidv4();
    socket.emit("create-room", key);
    creater[key] = userid;
    userRoom.set(key, {});
  });

  /**
   * Вход в комнату
   */
  socket.on("join-in-room", (data) => {
    if (data.id !== "") {
      console.log(`tut zahodim, ${data.key}, ${data.id}, ${data.name}`);

      //Проверяем есть ли в руме пользователи
      if (userRoom.get(data.key) !== undefined) {
        users = userRoom.get(data.key);
      } else {
        users = {};
      }

      let createrLogic =
        creater[data.key] && creater[data.key] === data.id ? true : false;

      users[data.id] = {
        name: data.name,
        id: data.id,
        balance: -1,
        creater: createrLogic,
      };

      userRoom.set(data.key, users);

      globalUsers[data.id].room = data.key;

      socket.join(data.key);
      console.log(`socket ${socket.id} has joined room ${data.key}`);
      console.log(userRoom.get(data.key));
      io.to(data.key).emit("update-users", userRoom.get(data.key));
    }
  });

  socket.on("set-balance", (data) => {
    console.log(`set-balance - socket.id=${socket.id}`);

    if (userRoom.get(data.key)) {
      console.log(`set-balance -- ${data.balance}`);
      users = userRoom.get(data.key);
      users[data.id]["balance"] = data.balance;
      userRoom.set(data.key, users);
    }

    io.to(data.key).emit("update-users", userRoom.get(data.key));
  });

  socket.on("promotion-admin", (data) => {
    console.log(`promotion-admin`);

    let users = userRoom.get(data.key);

    let logic = false;
    for (let item in users) {
      if (users[item].creater) {
        logic = true;
      }
    }

    if (!logic && users && users[data.id]) {
      users[data.id]["creater"] = true;
      userRoom.set(data.key, users);
      creater[data.key] = data.id;
      globalUsers[data.id].creater = true;
      io.to(data.key).emit("update-users", userRoom.get(data.key));
    }
  });

  socket.on("refuse-admin", (data) => {
    console.log("refuse-admin", globalUsers[data.id].creater);

    if (globalUsers[data.id].creater) {
      globalUsers[data.id].creater = false;
      delete creater[data.key];
      let users = userRoom.get(data.key);
      users[data.id].creater = false;
      io.to(data.key).emit("update-users", userRoom.get(data.key));
    }
  });

  socket.on("start-vote", (data) => {
    console.log("start-vote");

    let users = userRoom.get(data.key);
    for (item in users) {
      users[item].balance = -1;
    }
    userRoom.set(data.key, users);
    io.to(data.key).emit("update-users", userRoom.get(data.key));
    io.to(data.key).emit("start-vote-answer");
  });

  socket.on("end-vote", (data) => {
    io.to(data.key).emit("end-vote-answer");
  });

  socket.on("disconnect", () => {
    console.log(`disconnect - socket.id=${socket.id}`);

    //Получаем userid и удаляем его из globalSocketUsers
    let useridtmp = globalSocketUsers[socket.id];
    delete globalSocketUsers[socket.id];
    //Получаем user по userid и удаляем его из globalUsers
    let usertmp = globalUsers[useridtmp];
    delete globalUsers[useridtmp];
    //Получаем комнату если есть
    if (usertmp && usertmp.room) {
      socket.leave(usertmp.room);
      let users = userRoom.get(usertmp.room);
      if (users[useridtmp]) {
        delete users[useridtmp];
        userRoom.set(usertmp.room, users);
      }

      //Отправляем всем кто есть в этой комнате
      io.to(usertmp.room).emit(
        "update-users",
        userRoom.get(globalUsers[socket.id])
      );
    }
  });
});

app.use(function (req, res, next) {
  console.log("Time: %d", Date.now());
  next();
});
