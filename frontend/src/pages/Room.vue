<template>
  <div class="h25 table">
    <div v-if="!votedUsersCount" class="emptyTable">Пустой стол</div>
    <div class="users">
      <div v-for="item in votedUsers" :key="item.id" class="user">
        <div class="balance" v-if="roomSettingsViewBalance">
          {{ item.balance }}
        </div>
        <div class="balance" v-else>*</div>
        <div class="name">{{ item.name }}</div>
      </div>
    </div>
  </div>

  <div class="h25">
    <div class="h25-title">Участники</div>
    <div class="users">
      <div v-for="item in notVotedUsers" :key="item.id" class="user">
        <div class="name">{{ item.name }}</div>
      </div>
    </div>
  </div>

  <div class="h25">
    <template v-if="me && me.creater">
      <div class="h25-title">Действия</div>

      <div class="actions">
        <div class="action" @click="startVote">Начать голосование</div>
        <div class="action" @click="endVote">Закончить голосование</div>
        <div class="action" @click="refuseAdmin">
          Не хочу быть администратором стола
        </div>
      </div>
    </template>
    <template v-else>
      <div class="cards-wrapper">
        <div class="cards">
          <div
            v-for="(item, index) in cards"
            :key="`card-${index}`"
            class="card"
            :class="{ active: item === choiseCard }"
            @click="setChoiseCard(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import bus from "@/lib/bus";
import { Events, StatusSocket } from "@/const";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "@/store/store";
import { User, Users } from "@/interfaces/User";

export default {
  name: "Room",
  setup() {
    bus.$emit(Events.statusBar.statusChange, StatusSocket.joinRoom);
    const route = useRoute();
    const store = useStore();
    const userid = ref<string>("");
    userid.value = useStore().getters.id;
    const roomSettingsViewBalance = computed<boolean>(() => {
      return useStore().getters.roomSettingsViewBalance;
    });
    const users = computed<Users>(() => store.getters.users);
    const votedUsers = computed<Users>(() => store.getters.votedUsers);
    const notVotedUsers = computed<Users>(() => store.getters.notVotedUsers);
    const votedUsersCount = computed<number>(
      () => store.getters.votedUsersCount
    );
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

    const me = computed<User>(() => {
      if (users.value && userid.value) {
        return users.value[userid.value];
      }

      return { id: "", name: "", creater: false, balance: "" };
    });

    const checkAdmin = computed<boolean>(() => {
      if (users.value) {
        let logic = false;
        for (let item in users.value) {
          if (users.value[item].creater) {
            logic = true;
          }
        }

        return logic;
      }

      return true;
    });

    const promotion = () => bus.$emit(Events.poker.promotionAdmin);
    const refuseAdmin = () => {
      if (confirm("Вы уверены?")) {
        bus.$emit(Events.poker.refuseAdmin);
      }
    };
    const startVote = () => {
      bus.$emit(Events.poker.startVote);
    };

    const endVote = () => {
      bus.$emit(Events.poker.endVote);
    };

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
<style scoped>
.cards,
.users,
.actions {
  display: flex;
}

.actions {
  min-height: 130px;
  margin: 15px 0;
}

.users {
  height: 100%;
}

.action {
  padding: 15px;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  font-size: 0.9em;
  word-break: break-word;
  margin-right: 15px;
  transition: background 0.3s ease-out;
}

.action:hover {
  background: #d8d8d8;
}

.user .balance {
  font-size: 1.5em;
  font-weight: bold;
}
.user .name {
  clear: both;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  text-overflow: ellipsis;
  text-align: center;
}

.user {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: #fff;
  padding: 5px;
  width: 130px;
  height: 100%;
  border-radius: 15px;
  margin-right: 15px;
  box-sizing: border-box;
  transition: background 0.3s ease-out;
}

.cards-wrapper {
  overflow-x: auto;
}
.card {
  background: #fff;
  font-size: 3em;
  font-weight: bold;
  padding: 25px 0px;
  margin-right: 15px;
  border-radius: 15px;
  width: 100px;
  text-align: center;
  box-sizing: border-box;
  cursor: pointer;
}
.card.active {
  background: #4cbdff;
  color: #fff;
}
.promotion {
  display: inline-block;
  text-decoration: underline;
  cursor: pointer;
}
</style>
