import { IUser } from "../../../interfaces/iuser";

interface stateInterface {
  counter: number;
  name: string;
  socketUserId: string;
  users: IUser[];
  notVotedUsers: IUser[];
  votedUsers: IUser[];
  status: string;
  id: string;
  roomSettingsViewBalance: boolean;
}

export const state: stateInterface = {
  counter: 0,
  name: localStorage["name"] || "",
  socketUserId: "",
  users: [],
  notVotedUsers: [],
  votedUsers: [],
  status: "",
  id: localStorage["id"] || "",
  roomSettingsViewBalance: false,
};

export type State = typeof state;
