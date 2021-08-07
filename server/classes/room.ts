import { Callback, Collection } from "mongodb";
import { IRoom, RoomKey } from "../interfaces/iroom";

export class Room {
  public collection: Collection;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  public async create(roomId: RoomKey): Promise<void> {
    await this.collection.insertOne({ room: roomId });
  }

  public async get(roomId: RoomKey): Promise<IRoom> {
    return await this.collection.findOne<IRoom>({ room: roomId });
  }

  public getItem(roomId: RoomKey, callback: Callback): void {
    this.collection.findOne({ room: roomId }, callback);
  }

  public drop() {
    this.collection.deleteMany({});
  }
}
