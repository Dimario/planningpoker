import { Socket } from "socket.io";
import { User } from "./user";
import { Room } from "./room";
import { Events } from "../../frontend/src/const";
import { UserId } from "../interfaces/iuser";
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

  public async createRoom(data: IEnter) {
    try {
      let key = uuidv4() as RoomKey;
      this.socket.emit(Events.create.room, key);

      await this.createUser(data, true);
      await this.room.create(key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async createUser(
    data: IEnter,
    creator: boolean = false
  ): Promise<void> {
    await this.user.add({
      socketId: data.id,
      room: data.key,
      name: data.name,
      balance: -1,
      creator: creator,
    });
  }

  public async enterRoom(data: IEnter) {
    try {
      if (!data.id || !data.key) {
        return false;
      }

      if (
        !(await this.user.collection.find({ socketId: data.id }).toArray())
          .length
      ) {
        await this.createUser(data);
      }
      this.socket.join(data.key);
      await this.user.enter(data.id, data.key);
      this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async changeBalance(data: IEnter) {
    try {
      await this.user.changeBalance(data.id, data.balance);
      this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async promotionAdmin(data: IEnter): Promise<void> {
    try {
      await this.user.changeAdmin(data.id, true);
      this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async refuseAdmin(data: IEnter): Promise<void> {
    try {
      await this.user.changeAdmin(data.id, false);
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

  public async userDisconnect(userId: UserId) {
    try {
      await this.user.deleteUser(userId);
      /*
      //TODO: проверять если комната пустая, удалять комнату
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
    const users = await this.user.collection.find({ room: room }).toArray();
    this.io.to(room).emit(Events.server.updateUsers, users);
  }
}
