export interface User {
  id: string;
  name: string;
  balance: string;
  creater: boolean;
}

export interface SetUser {
  socket: string;
  id: string;
}
