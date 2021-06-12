import { Users } from "../interfaces/User";

interface stateInterface {
  counter: number;
  name: string;
  socketUserId: string;
  users: Users;
  notVotedUsers: Users;
  votedUsers: Users;
  votedUsersCount: number;
  status: string;
  id: string;
  roomSettingsViewBalance: boolean;
}

export const state: stateInterface = {
  counter: 0,
  name: localStorage["name"] || "",
  socketUserId: "",
  users: {},
  notVotedUsers: {},
  votedUsers: {},
  votedUsersCount: 0,
  status: "",
  id: localStorage["id"] || "",
  roomSettingsViewBalance: false,
};

export type State = typeof state;
