export type UserId = string;

export interface IUser {
  socketId: UserId;
  room: string | boolean;
  creator: boolean;
  balance: number;
  name?: string;
}
