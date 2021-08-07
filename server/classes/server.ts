import { Socket } from "socket.io";
import { User } from "./user";
import { Room } from "./room";
import { Events } from "../../frontend/src/const";
import { IUser, UserId } from "../interfaces/iuser";
import { v4 as uuidv4 } from "uuid";
import { RoomKey } from "../interfaces/iroom";
import { IEnter } from "../interfaces/interfaces";
import { FindCursor } from "mongodb";

export class Server {
  private socket: Socket;
  private user: User;
  private room: Room;
  private io: any;

  constructor(io: any, socket: Socket, user: User, room: Room) {
    this.io = io;
    this.socket = socket;
    this.user = user;
    this.room = room;
  }

  public async createRoom(userid: UserId) {
    try {
      let key = uuidv4() as RoomKey;
      this.socket.emit(Events.create.room, key);

      await this.room.create(key);
      await this.user.changeAdmin(userid, true);
      await this.user.enter(userid, key);
      await this.updateUsers(key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async enterRoom(data: IEnter) {
    try {
      if (!data.id || !data.key) {
        return false;
      }

      // this.user.enter(this.socket.id);

      console.log("socket.id", data.id);

      await this.user.add({
        socketId: data.id,
        room: data.key,
        name: data.name,
        balance: -1,
        creator: false,
      });

      this.socket.join(data.key);

      this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async changeBalance(data: IEnter) {
    try {
      await this.user.changeBalance(data.id, data.balance);
      await this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public promotionAdmin(data: IEnter) {
    try {
      this.user.changeAdmin(data.id, true);
      this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public refuseAdmin(data: IEnter) {
    try {
      this.user.changeAdmin(data.id, false);
      this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async startVote(data: IEnter): Promise<void> {
    try {
      await this.user.resetBalance(data.key);
      this.updateUsers(data.key);
      this.io.to(data.key).emit(Events.poker.startVoteServer);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async userDisconnect(socket: any) {
    try {
      console.log("disconnect", this.socket.id, socket.id);
      // console.log("disconnect", this.socket.id);
      await this.user.deleteUser(this.socket.id);
      /*
      //TODO: GGWP
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
       */
    } catch (e) {
      this.sendError(e);
    }
  }

  public endVote(data: IEnter) {
    this.io.to(data.key).emit(Events.poker.endVoteAnswer);
  }

  sendError(error: Error): void {
    this.socket.emit(Events.server.sendError, error);
  }

  private async updateUsers(room: RoomKey): Promise<void> {
    this.io
      .to(room)
      .emit(Events.server.updateUsers, await this.user.getRoomUsers(room));
  }
}
