import { Socket } from "socket.io";

import { v4 as uuidv4 } from "uuid";

const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app).listen(3001);
const io = require("socket.io")(server, { cors: { origin: "*" } });
import { Events } from "../frontend/src/const";

import { MongoClient, Db, Collection, Callback } from "mongodb";
import { IUser, UserId } from "./interfaces/iuser";
import { User } from "./classes/user";
import { Room } from "./classes/room";
import { RoomKey } from "./interfaces/iroom";
import { Server } from "./classes/server";
import { IEnter } from "./interfaces/interfaces";

async function mongoConnection() {
  let Client = MongoClient,
    user = "user",
    password = "password",
    port = 27119;

  try {
    const client = await Client.connect(
      `mongodb://${user}:${password}@localhost:${port}/opsdb"`,
      {
        authSource: "admin",
      }
    );

    mainWay(client.db("easy_planning_poker"));
  } catch (e) {
    console.error("Mongodb error connection", e);
  }
}

mongoConnection();

console.log("Start server");

type userName = string;
type usersTmp = { [key: string]: IUser };
type RoomId = string;

async function mainWay(db: Db) {
  const USER = new User(db.collection("users"));
  const ROOM = new Room(db.collection("rooms"));

  // USER.add({
  //   socketId: "test",
  //   room: "1",
  //   balance: -1,
  //   creator: false,
  //   name: "test",
  // });
  // console.log(await USER.get("test"));
  // console.log(await USER.get("123"));

  io.on("connection", (socket: Socket) => {
    const SERVER = new Server(io, socket, USER, ROOM);
    const userid: UserId = String(socket.handshake.query.userid) || uuidv4();

    //Отдаем пользователю id & socket.id
    socket.emit("set-user", {
      socket: socket.id,
      id: userid,
    });

    USER.add({ socketId: socket.id, room: false, creator: false, balance: -1 });

    //Событие создание комнаты
    socket.on(Events.create.room, (userid: UserId) =>
      SERVER.createRoom(userid)
    );

    //Вход в комнату
    socket.on(Events.server.joinRoom, (data: IEnter) => SERVER.enterRoom(data));

    //Смена баланса
    socket.on(Events.poker.setBalance, (data: IEnter) =>
      SERVER.changeBalance(data)
    );

    //Стать администратором
    socket.on(Events.poker.promotionAdmin, (data: IEnter) =>
      SERVER.promotionAdmin(data)
    );

    //Отказаться от администрирования
    socket.on(Events.poker.refuseAdmin, (data: IEnter) =>
      SERVER.refuseAdmin(data)
    );

    //Админ -> начало голосования
    socket.on(Events.poker.startVote, (data: IEnter) => SERVER.startVote(data));

    //Админ -> конец голосования
    socket.on(Events.poker.endVote, (data: IEnter) => SERVER.endVote(data));

    //Отключение
    socket.on("disconnect", () => SERVER.disconnect());
  });
}

app.use(function (req: any, res: any, next: any) {
  console.log("Time: %d", Date.now());
  next();
});
