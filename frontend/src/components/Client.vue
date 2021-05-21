<template><div></div></template>
<script lang="ts">
import { onMounted, ref } from "vue";
import io from "socket.io-client";
import bus from "@/lib/bus";
import { Events, StatusSocket } from "@/const";
import { Router, useRouter } from "vue-router";
import { Store, useStore } from "@/store/store";
import { User } from "@/interfaces/User";

const server = "http://localhost:3001";

const connection = (user: User, router: Router, store: Store) => {
  console.log("CONNECTION");
  const socket = io(`${server}?userid=${user.id}`);

  let room = "";
  bus.$emit(Events.statusBar.statusChange, StatusSocket.connection);

  //Событие захода в комнату
  const joinRoom = (roomKey: string) => {
    console.log("Заходим в комнату");
    room = roomKey;
    socket.emit("join-in-room", { key: roomKey, id: user.id, name: user.name });
  };

  const setBalance = (card: string) => {
    if (card === "x") card = "-1";
    socket.emit("set-balance", { id: user.id, key: room, balance: card });
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

  socket.on("connect", () => {
    bus.$emit(Events.statusBar.statusChange, StatusSocket.connect);

    socket.on("disconnect", () => {
      bus.$emit(Events.statusBar.statusChange, StatusSocket.disconnect);
    });

    /**
     * Логика приложения
     */
    //Установка базовых значений для юзера
    socket.on("set-user", (user: { socket: string; id: string }) => {
      store.commit("setUser", user);
    });
    //Создание комнаты
    bus.$on(Events.create.room, () => socket.emit(Events.create.room, user.id));
    //Ответ после создания комнаты и автомаческий переход в комнату
    socket.on("create-room", (key: string) => router.push(`/r/${key}`));
    //Получаем пользователей комнаты
    socket.on("update-users", (users: User[] | []) => {
      console.log("update-users", users);
      store.commit("setUsers", users);
    });

    socket.on(Events.poker.startVoteServer, () => {
      bus.$emit(Events.poker.startVoteServer);
    });
    socket.on(Events.poker.endVoteAnswer, () => {
      bus.$emit(Events.poker.endVoteAnswer);
    });
    /**
     * Остальная логика
     */
  });

  bus.$on(Events.get.room.id, (key: string) => joinRoom(key));
  bus.$on(Events.poker.setBalance, (card: string) => setBalance(card));
  bus.$on(Events.poker.promotionAdmin, promotionAdmin);
  bus.$on(Events.poker.refuseAdmin, refuseAdmin);
  bus.$on(Events.poker.startVote, startVote);
  bus.$on(Events.poker.endVote, endVote);
};

export default {
  name: "Client",
  setup() {
    onMounted(() => {
      const name = ref<string>();
      name.value = useStore().getters.name;
      const id = ref<string>();
      id.value = useStore().getters.id;
      const router: Router = useRouter();
      const store: Store = useStore();
      const user = ref<User>({
        id: id.value,
        name: name.value,
        balance: "-1",
        creater: false,
      });

      connection(user.value, router, store);
    });
  },
};
</script>
