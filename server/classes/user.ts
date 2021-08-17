import { Callback } from "mongodb";
import { RoomKey } from "../../interfaces/iroom";
import { IUser, UserId } from "../../interfaces/iuser";
import { DbCollection } from "./DbCollection";

export class User extends DbCollection {
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
    const item = await this.get(socketId);
    await this.collection.replaceOne(
      { socketId: socketId },
      { ...item, room: roomId }
    );
  }

  public async changeBalance(
    socketId: UserId,
    balance: string | number
  ): Promise<void> {
    const item: IUser = await this.get(socketId);
    await this.collection.replaceOne(
      { socketId: socketId },
      { ...item, balance: balance }
    );
  }

  public async resetBalance(roomId: RoomKey): Promise<void> {
    await this.collection.updateMany(
      { room: roomId },
      { $set: { balance: -1 } }
    );
  }

  public async changeAdmin(socketId: UserId, creator: boolean): Promise<void> {
    const item: IUser = await this.get(socketId);
    await this.collection.replaceOne(
      { socketId: socketId },
      { ...item, creator: creator }
    );
  }

  public async changeName(socketId: UserId, name: string): Promise<void> {
    const item: IUser = await this.get(socketId);
    await this.collection.replaceOne(
      { socketId: socketId },
      { ...item, name: name }
    );
  }

  public async deleteUser(socketId: UserId): Promise<void> {
    await this.collection.deleteOne({ socketId: socketId });
  }
}
