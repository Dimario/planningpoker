<template>
  <div class="statusBar">
    <div>Статус: {{ status }}</div>
    <div>Комната: {{ room }}</div>
  </div>
</template>
<script lang="ts">
import bus from "@/lib/bus";
import { Events } from "@/const";
import { ref } from "vue";

export default {
  name: "StatusBar",
  setup() {
    const status = ref<string>("");
    const room = ref<string>("");

    bus.$on(
      Events.statusBar.statusChange,
      (text: string) => (status.value = text)
    );
    bus.$on(Events.statusBar.roomChange, (text: string) => (room.value = text));

    return { status, room };
  },
};
</script>
<style scoped>
.statusBar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  padding: 5px;
}

.statusBar > div {
  margin-right: 15px;
}
</style>
