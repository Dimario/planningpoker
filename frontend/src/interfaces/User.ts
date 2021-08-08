export interface User {
  id: string;
  socketId: string;
  name: string;
  balance: string;
  creator: boolean;
}

export interface SetUser {
  socket: string;
  id: string;
}
