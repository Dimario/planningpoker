import { Callback, Collection, Filter, FindCursor } from "mongodb";
import { IUser, UserId } from "../interfaces/iuser";
import { RoomKey } from "../interfaces/iroom";

export class User {
  public collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  public async add(user: IUser): Promise<void> {
    await this.collection.insertOne(user);
  }

  public async get(socketId: UserId): Promise<IUser> {
    return await this.collection.findOne<IUser>({ socketId: socketId });
  }

  public async getItem(socketId: UserId, callback: Callback): Promise<void> {
    await this.collection.findOne(
      { socketId: socketId },
      (err: Error, item: IUser) => callback(err, item)
    );
  }

  public async enter(socketId: UserId, roomId: RoomKey): Promise<void> {
    await this.getItem(socketId, (err: Error, item: IUser) => {
      this.collection.replaceOne(
        { socketId: socketId },
        { ...item, room: roomId }
      );
    });
  }

  /*  public create(socketId: UserId, roomId: RoomKey): void {
    this.getItem(socketId, (err: Error, item: IUser) => {
      this.collection.replaceOne(
        { room: roomId },
        { ...item, room: roomId, creator: true }
      );
    });
  }*/

  public async getRoomUsers(roomId: RoomKey): Promise<IUser[]> {
    return await this.collection.find({ room: roomId }).toArray();
  }

  public async changeBalance(
    socketId: UserId,
    balance: string | number
  ): Promise<void> {
    return new Promise(async (resolve) => {
      await this.getItem(socketId, async (err: Error, item: IUser) => {
        item.balance = balance;
        await this.collection
          .replaceOne({ socketId: socketId }, item)
          .then(() => resolve());
      });
    });
  }

  public async resetBalance(roomId: RoomKey): Promise<void> {
    return new Promise(async (resolve) => {
      this.collection
        .updateMany({ room: roomId }, { $set: { balance: -1 } })
        .then(() => resolve());
    });
  }

  public async changeAdmin(socketId: UserId, creator: boolean): Promise<void> {
    return new Promise(async (resolve) => {
      await this.getItem(socketId, async (err: Error, item: IUser) => {
        item.creator = creator;
        await this.collection
          .replaceOne({ socketId: socketId }, item)
          .then(() => resolve());
      });
    });
  }

  public async deleteUser(socketId: UserId): Promise<void> {
    await this.collection.deleteOne({ socketId: socketId });
  }

  public async drop() {
    await this.collection.deleteMany({});
  }
}
