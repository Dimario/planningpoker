import { Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { MongoClient, Db } from "mongodb";
import { UserId } from "../interfaces/iuser";
import { Server } from "./classes/server";
import { IEnter } from "../interfaces/interfaces";
import { Events } from "../frontend/src/const";
import { Administrators } from "./classes/administrators";
import { User } from "./classes/user";
import { Room } from "./classes/room";

const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app).listen(3002);
const io = require("socket.io")(server, { cors: { origin: "*" } });

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

async function mainWay(db: Db) {
  const USER = new User(db.collection("users"));
  const ROOM = new Room(db.collection("rooms"));
  const ADMINISTRATORS = new Administrators(db.collection("administrators"));

  await USER.drop();
  await ROOM.drop();
  await ADMINISTRATORS.drop();

  let globalSocketUser: { [key: string]: string } = {};

  io.on("connection", async (socket: Socket) => {
    const SERVER = new Server(io, socket, USER, ROOM, ADMINISTRATORS);
    const userid: UserId = String(socket.handshake.query.userid) || uuidv4();

    socket.emit("set-user", {
      socket: socket.id,
      id: userid,
    });
    globalSocketUser[socket.id] = userid;

    //Событие создание комнаты
    socket.on(Events.create.room, (data: IEnter) => SERVER.createRoom(data));

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

    //Смена имени
    socket.on(Events.server.changeName, (data: IEnter) =>
      SERVER.changeName(data)
    );

    //Админ -> начало голосования
    socket.on(Events.poker.startVote, (data: IEnter) => SERVER.startVote(data));

    //Админ -> конец голосования
    socket.on(Events.poker.endVote, (data: IEnter) => SERVER.endVote(data));

    //Отключение
    socket.on("disconnect", () => {
      SERVER.userDisconnect(globalSocketUser[socket.id]);
      delete globalSocketUser[socket.id];
    });
  });
}
