import { GetterTree } from "vuex";
import { State } from "@/store/state";
import { User } from "@/interfaces/User";

export type Getters<S = State> = {
  me(state: S): User;
  name(state: S): string;
  socketUserId(state: S): string;
  users(state: S): User[];
  notVotedUsers(state: S): User[];
  votedUsers(state: S): User[];
  id(state: S): string;
  roomSettingsViewBalance(state: S): boolean;
};

export const getters: GetterTree<State, State> & Getters = {
  me: (state): User => {
    if (state.users) {
      return state.users.filter((item: User) => item.socketId === state.id)[0];
    }

    return { id: "", name: "", creator: false, balance: "", socketId: "" };
  },
  name: (state): string => {
    return state.name || "";
  },
  socketUserId: (state): string => {
    return state.socketUserId || "";
  },
  users: (state): User[] => {
    return state.users;
  },
  notVotedUsers: (state): User[] => {
    return state.notVotedUsers;
  },
  votedUsers: (state): User[] => {
    return state.votedUsers;
  },
  id: (state): string => {
    return state.id;
  },
  roomSettingsViewBalance: (state): boolean => {
    return state.roomSettingsViewBalance;
  },
};
