import io from "socket.io-client";
import bus from "./lib/bus";
import { Router } from "vue-router";
import { IUser } from "../../interfaces/iuser";
import { Store } from "./store/store";
import { Events, StatusSocket } from "./const";

const server = `http://${location.hostname}:3002`;

export function connection(user: IUser, router: Router, store: Store) {
  const socket = io(`${server}?userid=${user.id}`);

  let room = "";
  bus.$emit(Events.statusBar.statusChange, StatusSocket.connection);

  //Событие захода в комнату
  const joinRoom = (roomKey: string) => {
    room = roomKey;
    socket.emit(Events.server.joinRoom, {
      key: roomKey,
      id: user.id,
      name: user.name,
    });
  };

  const setBalance = (card: string) => {
    if (card === "x") card = "-1";
    socket.emit(Events.poker.setBalance, {
      id: user.id,
      key: room,
      balance: card,
    });
  };

  const promotionAdmin = () => {
    socket.emit(Events.poker.promotionAdmin, { id: user.id, key: room });
  };

  const refuseAdmin = () => {
    socket.emit(Events.poker.refuseAdmin, { id: user.id, key: room });
  };

  const startVote = () => {
    socket.emit(Events.poker.startVote, { id: user.id, key: room });
  };

  const endVote = () => {
    socket.emit(Events.poker.endVote, { id: user.id, key: room });
  };

  const changeName = () => {
    socket.emit(Events.server.changeName, {
      id: user.id,
      key: room,
      name: user.name,
    });
  };

  socket.on("connect", () => {
    bus.$emit(Events.statusBar.statusChange, StatusSocket.connect);

    socket.on("disconnect", () => {
      bus.$emit(Events.statusBar.statusChange, StatusSocket.disconnect);
    });

    /**
     * Логика приложения
     */
    //Установка базовых значений для юзера
    socket.on(Events.front.setUser, (user: { socket: string; id: string }) => {
      store.commit(Events.front.setUser, user);
    });
    //Ответ после создания комнаты и автомаческий переход в комнату
    socket.on(Events.create.room, (key: string) => router.push(`/r/${key}`));
    //Получаем пользователей комнаты
    socket.on(Events.server.updateUsers, (users: IUser[]) => {
      console.log(users);
      store.commit(Events.front.setUsers, users);
    });
    socket.on(Events.poker.startVoteServer, () => {
      bus.$emit(Events.poker.startVoteServer);
    });
    socket.on(Events.poker.endVoteAnswer, () => {
      bus.$emit(Events.poker.endVoteAnswer);
    });
    socket.on(Events.server.sendError, (e: string) => console.error(e));
  });

  bus.$on(Events.create.room, () => socket.emit(Events.create.room, user));
  bus.$on(Events.get.room.id, (key: string) => joinRoom(key));
  bus.$on(Events.poker.setBalance, (card: string) => setBalance(card));
  bus.$on(Events.poker.promotionAdmin, promotionAdmin);
  bus.$on(Events.poker.refuseAdmin, refuseAdmin);
  bus.$on(Events.poker.startVote, startVote);
  bus.$on(Events.poker.endVote, endVote);
  bus.$on(Events.server.changeName, changeName);
}
