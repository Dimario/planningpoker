<template>
  <h1>Planning Poker</h1>

  <button class="" @click="createRoom">Создать комнату</button>
  <div class="secondText">Или</div>
  <div class="input-row">
    <input placeholder="Введите код" v-model="code" />
    <button @click="setCode" @keydown.enter="setCode">Ok</button>
  </div>
</template>
<script lang="ts">
import { Events } from "@/const";
import bus from "@/lib/bus";
import { useRouter } from "vue-router";
import { ref } from "vue";

export default {
  name: "Mainpage",
  setup() {
    const router = useRouter();
    const createRoom = () => bus.$emit(Events.create.room);
    const code = ref<string>("");
    const setCode = () => router.push(`/r/${code.value}`);
    return { createRoom, code, setCode };
  },
};
</script>
<style scoped>
.secondText {
  margin: 50px 0;
}
</style>
