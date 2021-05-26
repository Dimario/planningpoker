import { MutationTypes } from "./store/mutations";

export const Events = {
  create: {
    room: "create-room",
  },
  front: {
    ...MutationTypes,
  },
  server: {
    joinRoom: "join-in-room",
    updateUsers: "update-users",
    sendError: "send-error",
  },
  statusBar: {
    statusChange: "status-change",
    roomChange: "room-change",
  },
  get: {
    room: {
      id: "get-room-id",
    },
  },
  poker: {
    setBalance: "poker-set-balance",
    promotionAdmin: "promotion-admin",
    refuseAdmin: "refuse-admin",
    startVote: "start-vote",
    startVoteServer: "start-vote-answer",
    endVote: "end-vote",
    endVoteAnswer: "end-vote-answer",
  },
};

export const StatusSocket = {
  connection: "Идёт подключение",
  connect: "Подключено",
  disconnect: "Отключено",
  joinRoom: "В комнате",
};
