<template>
  <section class="main">
    <SetName v-if="showName || show" />
    <router-view v-else />
    <Client />
  </section>
  <StatusBar />
</template>
<script lang="ts">
import StatusBar from "@/components/StatusBar.vue";
import Client from "@/components/Client.vue";
import SetName from "@/components/SetName.vue";
import bus from "@/lib/bus";
import { Events, StatusSocket } from "@/const";
import { computed, onMounted, ref } from "vue";
import { Store, useStore } from "@/store/store";

export default {
  name: "App",
  components: {
    SetName,
    StatusBar,
    Client,
  },
  setup() {
    const store: Store = useStore();
    const name = computed(() => store.getters.name);
    const room = ref<string>();
    const showName = ref<boolean>(false);

    const show = computed(() => {
      return name.value.length < 3;
    });

    onMounted(() => {
      bus.$on(Events.get.room.id, (key: string) => (room.value = key));
      bus.$emit(Events.statusBar.statusChange, StatusSocket.connection);
      bus.$emit(Events.statusBar.roomChange, "Отсутствует");
    });

    return { name, room, showName, show };
  },
};
</script>
<style scoped>
.main {
  padding: 50px;
}
</style>
