export type UserId = string;

export interface IUser {
  socketId: UserId;
  room: string | boolean;
  creator: boolean;
  balance: number | string;
  name?: string;
  id?: string;
}

export interface SetUser {
  socket: string;
  id: string;
}
