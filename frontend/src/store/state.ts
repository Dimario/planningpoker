import { User } from "@/interfaces/User";

interface stateInterface {
  counter: number;
  name: string;
  socketUserId: string;
  users: User[];
  notVotedUsers: User[];
  votedUsers: User[];
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
