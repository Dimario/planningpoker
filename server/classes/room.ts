import { Callback } from "mongodb";
import { IRoom, RoomKey } from "../../interfaces/iroom";
import { DbCollection } from "./DbCollection";

export class Room extends DbCollection {
  public async create(roomId: RoomKey): Promise<void> {
    await this.collection.insertOne({ room: roomId });
  }

  public async get(roomId: RoomKey): Promise<IRoom> {
    return await this.collection.findOne<IRoom>({ room: roomId });
  }

  public getItem(roomId: RoomKey, callback: Callback): void {
    this.collection.findOne({ room: roomId }, callback);
  }
}
