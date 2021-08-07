import { Callback, Collection, Filter, FindCursor } from "mongodb";
import { IUser, UserId } from "../interfaces/iuser";
import { RoomKey } from "../interfaces/iroom";

export class User {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  public add(user: IUser): void {
    this.collection.insertOne(user);
  }

  public async get(socketId: UserId): Promise<IUser> {
    return await this.collection.findOne<IUser>({ socketId: socketId });
  }

  public getItem(socketId: UserId, callback: Callback): void {
    this.collection.findOne({ socketId: socketId }, callback);
  }

  public enter(socketId: UserId, roomId: RoomKey): void {
    this.getItem(socketId, (err: Error, item: any) => {
      item.room = roomId;
      this.collection.replaceOne({ room: roomId }, item);
    });
  }

  public create(socketId: UserId, roomId: RoomKey): void {
    this.getItem(socketId, (err: Error, item: IUser) => {
      item.room = roomId;
      item.creator = true;
      this.collection.replaceOne({ room: roomId }, item);
    });
  }

  public async find(find: any): Promise<IUser[]> {
    //@ts-ignore
    return await this.collection.find<IUser[]>(find);
  }
}
