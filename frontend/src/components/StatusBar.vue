<template>
  <div class="statusBar">
    <div>Статус: {{ status }}</div>
    <div>Комната: {{ room }}</div>
    <div>{{ name }} <span @click="editName">✏️</span></div>
  </div>
</template>
<script lang="ts">
import bus from "@/lib/bus";
import { Events } from "@/const";
import { ref } from "vue";
import { Store, useStore } from "@/store/store";

export default {
  name: "StatusBar",
  setup() {
    const store: Store = useStore();
    const status = ref<string>("");
    const room = ref<string>("");
    const name = ref<string>("");
    name.value = store.getters.name;

    bus.$on(
      Events.statusBar.statusChange,
      (text: string) => (status.value = text)
    );
    bus.$on(Events.statusBar.roomChange, (text: string) => (room.value = text));

    const editName = () => {
      bus.$emit(Events.statusBar.editName, true);
    };

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
