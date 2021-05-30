<template>
  <section class="main">
    <SetName v-if="showName || show" />
    <router-view v-else />
  </section>
  <StatusBar />
</template>
<script lang="ts">
import StatusBar from "@/components/StatusBar.vue";
import SetName from "@/components/SetName.vue";
import bus from "@/lib/bus";
import { Events, StatusSocket } from "@/const";
import { computed, onMounted, ref, reactive } from "vue";
import { Store, useStore } from "@/store/store";
import { connection } from "@/client";
import { Router, useRouter } from "vue-router";
import LS from "@/lib/localstorage";

export default {
  name: "App",
  components: {
    SetName,
    StatusBar,
  },
  setup() {
    const store: Store = useStore();
    const router: Router = useRouter();
    const name = computed<string>(() => {
      return useStore().getters.name;
    });
    const id = computed<string>(() => {
      return useStore().getters.id;
    });
    const user = reactive({
      id: computed(() => id.value),
      name: computed(() => name.value),
      balance: "-1",
      creater: false,
    });
    const room = ref<string>();
    const showName = ref<boolean>(false);
    const show = computed(() => {
      return name.value.length < 3;
    });

    onMounted(() => {
      bus.$on(Events.get.room.id, (key: string) => (room.value = key));
      bus.$emit(Events.statusBar.statusChange, StatusSocket.connection);
      bus.$emit(Events.statusBar.roomChange, "Отсутствует");
      bus.$on(Events.statusBar.editName, (show: boolean) => {
        showName.value = show;
      });

      connection(user, router, store);
    });

    new LS();

    return { name, room, showName, show };
  },
};
</script>
<style scoped>
.main {
  padding: 50px;
}
</style>
