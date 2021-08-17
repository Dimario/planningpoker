import { MutationTree } from "vuex";
import { State } from "./state";
import { IUser, SetUser } from "../../../interfaces/iuser";

export enum MutationTypes {
  setName = "set-name",
  setUsers = "set-users",
  setUser = "set-user",
  roomSettingsViewBalance = "room-settings-view-balance",
}

export type Mutations<S = State> = {
  [MutationTypes.setName](state: S, payload: string): void;
  [MutationTypes.setUsers](state: S, payload: IUser[]): void;
  [MutationTypes.setUser](state: S, payload: SetUser): void;
  [MutationTypes.roomSettingsViewBalance](state: S, payload: boolean): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [MutationTypes.setName](state, payload: string) {
    state.name = payload;
  },
  [MutationTypes.setUsers](state, payload: IUser[]) {
    state.users = payload;

    state.votedUsers = payload.filter(
      (item: IUser) => String(item.balance) != "-1"
    );
    state.notVotedUsers = payload.filter(
      (item: IUser) => String(item.balance) === "-1"
    );
  },
  [MutationTypes.setUser](state, payload: SetUser) {
    console.log("payload", payload);
    state.id = payload.id;
    state.socketUserId = payload.socket;
    localStorage["id"] = payload.id;
  },
  [MutationTypes.roomSettingsViewBalance](state, payload: boolean) {
    state.roomSettingsViewBalance = payload;
  },
};
