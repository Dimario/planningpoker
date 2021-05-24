import { GetterTree } from "vuex";
import { State } from "@/store/state";
import { User } from "@/interfaces/User";

export type Getters<S = State> = {
  name(state: S): string;
  socketUserId(state: S): string;
  users(state: S): User[] | [];
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
  users: (state): User[] | [] => {
    return state.users;
  },
  id: (state): string => {
    return state.id;
  },
  roomSettingsViewBalance: (state): boolean => {
    return state.roomSettingsViewBalance;
  },
};
