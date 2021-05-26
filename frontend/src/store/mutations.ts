import { User, SetUser } from "../interfaces/User";
import { MutationTree } from "vuex";
import { State } from "./state";

export enum MutationTypes {
  setName = "set-name",
  setUsers = "set-users",
  setUser = "set-user",
  roomSettingsViewBalance = "room-settings-view-balance",
}

export type Mutations<S = State> = {
  [MutationTypes.setName](state: S, payload: string): void;
  [MutationTypes.setUsers](state: S, payload: User[] | []): void;
  [MutationTypes.setUser](state: S, payload: SetUser): void;
  [MutationTypes.roomSettingsViewBalance](state: S, payload: boolean): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [MutationTypes.setName](state, payload: string) {
    state.name = payload;
  },
  [MutationTypes.setUsers](state, payload: User[] | []) {
    state.users = payload;
  },
  [MutationTypes.setUser](state, payload: SetUser) {
    state.id = payload.id;
    state.socketUserId = payload.socket;
    localStorage["id"] = payload.id;
  },
  [MutationTypes.roomSettingsViewBalance](state, payload: boolean) {
    state.roomSettingsViewBalance = payload;
  },
};
