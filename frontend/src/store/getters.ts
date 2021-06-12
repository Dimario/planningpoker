import { GetterTree } from "vuex";
import { State } from "@/store/state";
import { Users } from "@/interfaces/User";

export type Getters<S = State> = {
  name(state: S): string;
  socketUserId(state: S): string;
  users(state: S): Users;
  notVotedUsers(state: S): Users;
  votedUsers(state: S): Users;
  votedUsersCount(state: S): number;
  id(state: S): string;
  roomSettingsViewBalance(state: S): boolean;
};

export const getters: GetterTree<State, State> & Getters = {
  name: (state): string => {
    return state.name || "";
  },
  socketUserId: (state): string => {
    return state.socketUserId || "";
  },
  users: (state): Users => {
    return state.users;
  },
  notVotedUsers: (state): Users => {
    return state.notVotedUsers;
  },
  votedUsers: (state): Users => {
    return state.votedUsers;
  },
  votedUsersCount: (state): number => {
    return state.votedUsersCount;
  },
  id: (state): string => {
    return state.id;
  },
  roomSettingsViewBalance: (state): boolean => {
    return state.roomSettingsViewBalance;
  },
};
