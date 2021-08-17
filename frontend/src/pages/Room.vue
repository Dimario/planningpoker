<template>
  <div class="h25 table">
    <div v-if="!votedUsersCount" class="emptyTable">Пустой стол</div>
    <UserList
      :users="votedUsers"
      need-show-balance
      :balance="roomSettingsViewBalance"
    />
  </div>

  <div class="h25">
    <div class="h25-title">Участники</div>
    <UserList :users="notVotedUsers" />
  </div>

  <div class="h25">
    <template v-if="me && me.creator">
      <div class="h25-title">Действия</div>

      <div class="actions h80">
        <button class="action" @click="startVote">Начать голосование</button>
        <button class="action" @click="endVote">Закончить голосование</button>
        <button class="action" @click="refuseAdmin">
          Не хочу быть администратором стола
        </button>
      </div>
    </template>
    <template v-else>
      <div class="cards h80">
        <button
          v-for="(item, index) in cards"
          :key="`card-${index}`"
          class="card"
          :class="{ active: item === choiseCard }"
          @click="setChoiseCard(item)"
        >
          {{ item }}
        </button>
      </div>
    </template>
    <div v-if="!checkAdmin" class="h20 align-center">
      В комнате отсутствует администратор.
      <button class="inline" @click="promotion">Стать администратором</button>
    </div>
  </div>
</template>
<script lang="ts">
import bus from "../lib/bus";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "@/store/store";
import UserList from "@/components/UserList.vue";
import { IUser } from "../../../interfaces/iuser";
import { Events, StatusSocket } from "../const";

export default {
  name: "Room",
  components: { UserList },
  setup() {
    bus.$emit(Events.statusBar.statusChange, StatusSocket.joinRoom);
    const route = useRoute();
    const store = useStore();
    const userid = ref<string>("");
    userid.value = useStore().getters.id;
    const roomSettingsViewBalance = computed<boolean>(() => {
      return useStore().getters.roomSettingsViewBalance;
    });
    const me = computed<IUser>(() => store.getters.me);
    const users = computed<IUser[]>(() => store.getters.users);
    const votedUsers = computed<IUser[]>(() => store.getters.votedUsers);
    const notVotedUsers = computed<IUser[]>(() => store.getters.notVotedUsers);
    const votedUsersCount = computed<number>(() => votedUsers.value.length);
    const cards = ["1", "2", "3", "5", "8", "13", "21", "?"];
    const choiseCard = ref<string>("");
    const setChoiseCard = (card: string) => {
      if (choiseCard.value === card) {
        choiseCard.value = "";
        bus.$emit(Events.poker.setBalance, String("x"));
      } else {
        choiseCard.value = card;
        bus.$emit(Events.poker.setBalance, String(card));
      }
    };
    onMounted(() => {
      bus.$emit(Events.get.room.id, route.params.key);
      bus.$emit(Events.statusBar.roomChange, route.params.key);
    });

    const checkAdmin = computed<boolean>(() => {
      if (users.value) {
        return Boolean(
          users.value.filter((item: IUser) => item.creator).length
        );
      }

      return false;
    });

    const promotion = () => bus.$emit(Events.poker.promotionAdmin);
    const refuseAdmin = () => {
      if (confirm("Вы уверены?")) {
        bus.$emit(Events.poker.refuseAdmin);
      }
    };
    const startVote = () => bus.$emit(Events.poker.startVote);
    const endVote = () => bus.$emit(Events.poker.endVote);

    bus.$on(Events.poker.startVoteServer, () => {
      choiseCard.value = "-1";
      useStore().commit(Events.front.roomSettingsViewBalance, false);
    });
    bus.$on(Events.poker.endVoteAnswer, () => {
      useStore().commit(Events.front.roomSettingsViewBalance, true);
    });

    return {
      users,
      cards,
      choiseCard,
      setChoiseCard,
      me,
      checkAdmin,
      promotion,
      refuseAdmin,
      roomSettingsViewBalance,
      startVote,
      endVote,
      votedUsersCount,
      votedUsers,
      notVotedUsers,
    };
  },
};
</script>
