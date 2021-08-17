import { Socket } from "socket.io";
import { User } from "./user";
import { Room } from "./room";
import { Events } from "../../frontend/src/const";
import { UserId } from "../../interfaces/iuser";
import { v4 as uuidv4 } from "uuid";
import { RoomKey } from "../../interfaces/iroom";
import { IEnter } from "../../interfaces/interfaces";
import { Administrators } from "./administrators";

export class Server {
  private socket: Socket;
  private user: User;
  private room: Room;
  private administrators: Administrators;
  private io: any;

  constructor(
    io: any,
    socket: Socket,
    user: User,
    room: Room,
    administrators: Administrators
  ) {
    this.io = io;
    this.socket = socket;
    this.user = user;
    this.room = room;
    this.administrators = administrators;
  }

  public async createRoom(data: IEnter) {
    try {
      let key = uuidv4() as RoomKey;
      this.socket.emit(Events.create.room, key);

      await this.createUser(data, true);
      await this.administrators.create(data.id, key);
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

      // console.log(data);
      const creator = await this.administrators.get(data.id);
      const creatorLogic = creator ? creator.room === data.key : false;

      // console.log(creator);
      console.log(creatorLogic);

      if (
        !(await this.user.collection.find({ socketId: data.id }).toArray())
          .length
      ) {
        await this.createUser(data, creatorLogic);
      }
      this.socket.join(data.key);
      await this.user.enter(data.id, data.key);
      await this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async changeBalance(data: IEnter) {
    console.log("change-balance", data);
    try {
      await this.user.changeBalance(data.id, data.balance);
      await this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async promotionAdmin(data: IEnter): Promise<void> {
    try {
      await this.administrators.create(data.id, data.key);
      await this.user.changeAdmin(data.id, true);
      await this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async refuseAdmin(data: IEnter): Promise<void> {
    try {
      await this.administrators.delete(data.id);
      await this.user.changeAdmin(data.id, false);
      await this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async startVote(data: IEnter): Promise<void> {
    try {
      await this.user.resetBalance(data.key);
      await this.updateUsers(data.key);
      this.io.to(data.key).emit(Events.poker.startVoteServer);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async changeName(data: IEnter): Promise<void> {
    try {
      await this.user.changeName(data.id, data.name);
      await this.updateUsers(data.key);
    } catch (e) {
      this.sendError(e);
    }
  }

  public async userDisconnect(userId: UserId) {
    try {
      await this.user.deleteUser(userId);
      // TODO: проверять если комната пустая, удалять комнату
      // TODO: запускать таймер, для удаления администратора если он не зайдет через N секунд, удалять запись
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
