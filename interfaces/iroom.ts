import { IUser } from "./iuser";

export type RoomKey = string;

export interface IRoom {
  roomId: RoomKey;
  users: IUser[];
}
