import { User } from "@/interfaces/User";
import { MutationTree } from "vuex";
import { State } from "./state";

interface SetUser {
  socket: string;
  id: string;
}

export type Mutations<S = State> = {
  setName(state: S, payload: string): void;
  setUsers(state: S, payload: User[] | []): void;
  setUser(state: S, payload: SetUser): void;
  roomSettingsViewBalance(state: S, payload: boolean): void;
};

export const mutations: MutationTree<State> & Mutations = {
  setName(state, payload: string) {
    state.name = payload;
  },
  setUsers(state, payload: User[] | []) {
    state.users = payload;
  },
  setUser(state, payload: SetUser) {
    state.id = payload.id;
    state.socketUserId = payload.socket;
    localStorage["id"] = payload.id;
  },
  roomSettingsViewBalance(state, payload: boolean) {
    state.roomSettingsViewBalance = payload;
  },
};
