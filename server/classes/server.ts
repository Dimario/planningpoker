import { Socket } from "socket.io";
import { User } from "./user";
import { Room } from "./room";
import { Events } from "../../frontend/src/const";
import { IUser, UserId } from "../interfaces/iuser";
import { v4 as uuidv4 } from "uuid";
import { RoomKey } from "../interfaces/iroom";
import { IEnter } from "../interfaces/interfaces";

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

  public createRoom(userid: UserId) {
    try {
      let key = uuidv4() as RoomKey;
      this.socket.emit(Events.create.room, key);
      this.user.create(userid, key);
      this.room.add(key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public enterRoom(data: IEnter) {
    try {
      if (!data.id || !data.key) {
        return false;
      }

      this.user.add({
        socketId: data.id,
        room: data.key,
        name: data.name,
        balance: -1,
        creator: false,
      });

      this.socket.join(data.key);

      this.io
        .to(data.key)
        .emit(Events.server.updateUsers, this.getRoomUsers(data.key));
    } catch (e) {
      this.sendError(e);
    }
  }

  public changeBalance(data: IEnter) {
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
  }

  public promotionAdmin(data: IEnter) {
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
  }

  public refuseAdmin(data: IEnter) {
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
  }

  /**
   * Старт голосования
   * @param data
   */
  public startVote(data: IEnter) {
    try {
      let users = userRoom.get(data.key);
      for (let item in users) {
        users[item].balance = -1;
      }
      userRoom.set(data.key, users);
      this.io
        .to(data.key)
        .emit(Events.server.updateUsers, userRoom.get(data.key));
      this.io.to(data.key).emit(Events.poker.startVoteServer);
    } catch (e) {
      this.sendError(e);
    }
  }

  public disconnect() {
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
  }

  /**
   * Конец голосования
   * @param data
   */
  public endVote(data: IEnter) {
    this.io.to(data.key).emit(Events.poker.endVoteAnswer);
  }

  public async getRoomUsers(roomId: RoomKey): Promise<IUser[]> {
    return await this.user.find({ room: roomId });
  }

  private sendError(error: Error): void {
    this.socket.emit(Events.server.sendError, error);
  }
}
