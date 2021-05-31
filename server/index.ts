import { Socket } from "socket.io";

import { v4 as uuidv4 } from "uuid";
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app).listen(3001);
const io = require("socket.io")(server, { cors: { origin: "*" } });
import { Events } from "../frontend/src/const";

console.log("Start server");

type userIdType = string;
type userName = string;
type usersTmp = { [key: string]: User };

interface defaultData {
  id: userIdType;
  key: string;
}

type defaultDataIname = defaultData & { name: string };
type defaultDataIbalance = defaultData & { balance: string };

interface User {
  name: string;
  id: userIdType;
  balance: string | number;
  creater: boolean;
}

interface UserInterface {
  socket: string;
  room: string | boolean;
  creator: boolean;
}

const userRoom = new Map(),
  globalUsers: { [key: string]: UserInterface } = {},
  globalSocketUsers: { [key: string]: userIdType } = {},
  creater: { [key: string]: userIdType } = {};

io.on("connection", (socket: Socket) => {
  const userid: userIdType = String(socket.handshake.query.userid) || uuidv4();

  //Отдаем пользователю id & socket.id
  socket.emit("set-user", {
    socket: socket.id,
    id: userid,
  });

  //Устанавливаем пустое значение для пользователя
  globalUsers[userid] = {
    socket: socket.id,
    room: false,
    creator: false,
  };
  globalSocketUsers[socket.id] = userid;

  //Событие создание комнаты
  socket.on(Events.create.room, (userid: userIdType) => {
    try {
      let key = uuidv4();
      socket.emit(Events.create.room, key);
      creater[key] = userid;
      userRoom.set(key, {});
    } catch (e) {
      sendError(e);
    }
  });

  //Вход в комнату
  socket.on(Events.server.joinRoom, (data: defaultDataIname) => {
    try {
      if (data.id !== "") {
        let users: usersTmp = {};

        //Проверяем есть ли в руме пользователи
        if (userRoom.get(data.key) !== undefined) {
          users = userRoom.get(data.key);
        }

        let createrLogic: boolean = Boolean(
          creater[data.key] && creater[data.key] === data.id
        );

        users[data.id] = {
          name: data.name,
          id: data.id,
          balance: -1,
          creater: createrLogic,
        };

        userRoom.set(data.key, users);

        globalUsers[data.id].room = data.key;

        socket.join(data.key);

        io.to(data.key).emit(Events.server.updateUsers, userRoom.get(data.key));
      }
    } catch (e) {
      sendError(e);
    }
  });

  //Смена баланса
  socket.on(Events.poker.setBalance, (data: defaultDataIbalance) => {
    try {
      if (userRoom.get(data.key)) {
        let users: usersTmp = {};
        users = userRoom.get(data.key);
        users[data.id]["balance"] = data.balance;
        userRoom.set(data.key, users);
      }

      io.to(data.key).emit(Events.server.updateUsers, userRoom.get(data.key));
    } catch (e) {
      sendError(e);
    }
  });

  //Стать администратором
  socket.on(Events.poker.promotionAdmin, (data: defaultData) => {
    try {
      let users: usersTmp = userRoom.get(data.key);

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
        globalUsers[data.id].creator = true;
        io.to(data.key).emit(Events.server.updateUsers, userRoom.get(data.key));
      }
    } catch (e) {
      sendError(e);
    }
  });

  //Отказаться от администрирования
  socket.on(Events.poker.refuseAdmin, (data: defaultData) => {
    try {
      let users: usersTmp = userRoom.get(data.key);

      if (users && users[data.id]) {
        users[data.id].creater = false;

        if (creater[data.key]) {
          delete creater[data.key];
        }

        userRoom.set(data.key, users);
        io.to(data.key).emit(Events.server.updateUsers, userRoom.get(data.key));
      }
    } catch (e) {
      sendError(e);
    }
  });

  //Админ -> начало голосования
  socket.on(Events.poker.startVote, (data: defaultData) => {
    try {
      let users = userRoom.get(data.key);
      for (let item in users) {
        users[item].balance = -1;
      }
      userRoom.set(data.key, users);
      io.to(data.key).emit(Events.server.updateUsers, userRoom.get(data.key));
      io.to(data.key).emit(Events.poker.startVoteServer);
    } catch (e) {
      sendError(e);
    }
  });

  //Админ -> конец голосования
  socket.on(Events.poker.endVote, (data) => {
    io.to(data.key).emit(Events.poker.endVoteAnswer);
  });

  //Отключение
  socket.on("disconnect", () => {
    try {
      //Получаем userid и удаляем его из globalSocketUsers
      let useridtmp = globalSocketUsers[socket.id];
      delete globalSocketUsers[socket.id];
      //Получаем user по userid и удаляем его из globalUsers
      let usertmp = globalUsers[useridtmp];
      delete globalUsers[useridtmp];
      //Получаем комнату если есть
      if (usertmp && typeof usertmp.room === "string") {
        socket.leave(usertmp.room);
        let users = userRoom.get(usertmp.room);
        if (users[useridtmp]) {
          delete users[useridtmp];
          userRoom.set(usertmp.room, users);
        }

        //Отправляем всем кто есть в этой комнате
        io.to(usertmp.room).emit(
          Events.server.updateUsers,
          userRoom.get(usertmp.room)
        );
      }
    } catch (e) {
      sendError(e);
    }
  });

  const sendError = (error: string): void => {
    socket.emit(Events.server.sendError, error);
  };
});

app.use(function (req: any, res: any, next: any) {
  console.log("Time: %d", Date.now());
  next();
});
