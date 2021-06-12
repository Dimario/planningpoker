export interface User {
  id: string;
  name: string;
  balance: string;
  creater: boolean;
}

export type Users = { [key: string]: User };

export interface SetUser {
  socket: string;
  id: string;
}
