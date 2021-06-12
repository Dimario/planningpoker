import { Users, SetUser } from "../interfaces/User";
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
  [MutationTypes.setUsers](state: S, payload: Users): void;
  [MutationTypes.setUser](state: S, payload: SetUser): void;
  [MutationTypes.roomSettingsViewBalance](state: S, payload: boolean): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [MutationTypes.setName](state, payload: string) {
    state.name = payload;
  },
  [MutationTypes.setUsers](state, payload: Users) {
    state.users = payload;

    const votedUsers: Users = Object.keys(payload).reduce(
      (previousValue: Users, currentValue: string) => {
        if (String(payload[currentValue].balance) != "-1") {
          previousValue[currentValue] = payload[currentValue];
        }

        return previousValue;
      },
      {}
    );

    state.votedUsers = votedUsers;
    state.votedUsersCount = Object.keys(state.votedUsers).length;

    const notVotedUsers: Users = Object.keys(payload).reduce(
      (previousValue: Users, currentValue: string) => {
        if (String(payload[currentValue].balance) === "-1") {
          previousValue[currentValue] = payload[currentValue];
        }

        return previousValue;
      },
      {}
    );

    state.notVotedUsers = notVotedUsers;
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
