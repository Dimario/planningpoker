import { UserId } from "../../interfaces/iuser";
import { RoomKey } from "../../interfaces/iroom";
import { DbCollection } from "./DbCollection";

export class Administrators extends DbCollection {
  public async create(userId: UserId, room: RoomKey): Promise<void> {
    await this.collection.insertOne({ userId: userId, room: room });
  }

  public async get(userId: UserId): Promise<any> {
    return await this.collection.findOne({ userId: userId });
  }

  public async delete(userId: UserId): Promise<void> {
    await this.collection.deleteOne({ userId: userId });
  }
}
