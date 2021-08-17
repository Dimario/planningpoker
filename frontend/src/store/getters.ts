import { GetterTree } from "vuex";
import { State } from "./state";
import { IUser } from "../../../interfaces/iuser";

export type Getters<S = State> = {
  me(state: S): IUser;
  name(state: S): string;
  socketUserId(state: S): string;
  users(state: S): IUser[];
  notVotedUsers(state: S): IUser[];
  votedUsers(state: S): IUser[];
  id(state: S): string;
  roomSettingsViewBalance(state: S): boolean;
};

export const getters: GetterTree<State, State> & Getters = {
  me: (state): IUser => {
    if (state.users) {
      return state.users.filter((item: IUser) => item.socketId === state.id)[0];
    }

    return { socketId: "", name: "", creator: false, balance: "", room: "" };
  },
  name: (state): string => {
    return state.name || "";
  },
  socketUserId: (state): string => {
    return state.socketUserId || "";
  },
  users: (state): IUser[] => {
    return state.users;
  },
  notVotedUsers: (state): IUser[] => {
    return state.notVotedUsers;
  },
  votedUsers: (state): IUser[] => {
    return state.votedUsers;
  },
  id: (state): string => {
    return state.id;
  },
  roomSettingsViewBalance: (state): boolean => {
    return state.roomSettingsViewBalance;
  },
};
