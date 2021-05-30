<template>
  <div class="secondText">Стол</div>

  <div class="users">
    <div v-for="item in users" :key="item.id">
      <div class="user" v-if="item.balance != '-1'">
        <div class="balance">
          <template v-if="roomSettingsViewBalance">
            {{ item.balance }}
          </template>
          <template v-else> * </template>
        </div>
        <div class="name">{{ item.name }}</div>
      </div>
    </div>
  </div>
  <div class="secondText">Участники</div>
  <div class="users">
    <div v-for="item in users" :key="item.id">
      <div class="user" v-if="item.balance == '-1'">
        <div class="name">{{ item.name }}</div>
      </div>
    </div>
  </div>

  <div v-if="me && me.creater">
    <div class="secondText">Действия</div>

    <div class="actions">
      <div class="action" @click="startVote">Начать голосование</div>
      <div class="action" @click="endVote">Закончить голосование</div>
      <div class="action" @click="refuseAdmin">
        Не хочу быть администратором стола
      </div>
    </div>
  </div>
  <div v-else>
    <div class="secondText">Ваш выбор</div>
    <div class="cards-wrapper">
      <div class="cards">
        <div v-for="(item, index) in cards" :key="`card-${index}`">
          <div
            class="card"
            :class="{ active: item === choiseCard }"
            @click="setChoiseCard(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="!checkAdmin">
    У стола нету администратора!
    <div @click="promotion" class="promotion">стать администратором</div>
  </div>
</template>
<script lang="ts">
import bus from "@/lib/bus";
import { Events, StatusSocket } from "@/const";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "@/store/store";
import { User } from "@/interfaces/User";

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
    const users = computed<User[] | []>(() => store.getters.users);
    const cards = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "x"];
    const choiseCard = ref<string>("");
    const setChoiseCard = (card: string) => {
      if (choiseCard.value != card) {
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
        //@ts-ignore
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
  min-height: 130px;
  margin: 15px 0;
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
  height: 130px;
  border-radius: 15px;
  margin-right: 15px;
  box-sizing: border-box;
  transition: background 0.3s ease-out;
}

.user:hover {
  background: #d8d8d8;
}

.cards-wrapper {
  overflow-x: auto;
  margin: 15px 0;
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
