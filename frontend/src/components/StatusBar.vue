<template>
  <div class="statusBar">
    <div>Статус: {{ status }}</div>
    <div>Комната: {{ room }}</div>
    <button class="inline" @click="editName">{{ name }}</button>
  </div>
</template>
<script lang="ts">
import bus from "../lib/bus";
import { computed, ref } from "vue";
import { Events } from "../const";
import { Store, useStore } from "../store/store";

export default {
  name: "StatusBar",
  setup() {
    const store: Store = useStore();
    const status = ref<string>("");
    const room = ref<string>("");
    const name = computed<string>(() => store.getters.name);

    bus.$on(
      Events.statusBar.statusChange,
      (text: string) => (status.value = text)
    );
    bus.$on(Events.statusBar.roomChange, (text: string) => (room.value = text));

    const editName = () => bus.$emit(Events.statusBar.editName, true);

    return { status, room, name, editName };
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
