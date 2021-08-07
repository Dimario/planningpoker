import { Callback, Collection } from "mongodb";
import { IRoom, RoomKey } from "../interfaces/iroom";

export class Room {
  private collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  public add(roomId: RoomKey): void {
    this.collection.insertOne({ room: roomId, users: [] });
  }

  public async get(roomId: RoomKey): Promise<IRoom> {
    return await this.collection.findOne<IRoom>({ room: roomId });
  }

  public getItem(roomId: RoomKey, callback: Callback): void {
    this.collection.findOne({ room: roomId }, callback);
  }

  public updateRoom(roomId: RoomKey) {
    this.getItem(roomId, (err: Error, item: any) => {
      item.users.push({ test: 1, b: 2, c: 3 });

      this.collection.replaceOne({ room: roomId }, item);
    });
  }
}
