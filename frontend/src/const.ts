import { MutationTypes } from "./store/mutations";

export const Events = {
  create: {
    room: "create-room",
  },
  front: {
    ...MutationTypes,
    keyUpEsc: "key-up-esc",
    keyUpRight: "key-up-right",
    keyUpLeft: "key-up-left",
  },
  server: {
    joinRoom: "join-in-room",
    updateUsers: "update-users",
    sendError: "send-error",
  },
  statusBar: {
    statusChange: "status-change",
    roomChange: "room-change",
    editName: "edit-name",
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
