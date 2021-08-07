<template>
  <section class="main">
    <SetName v-if="shouldShowSetName" :isEdit="showName" />
    <div :class="{ hide: shouldShowSetName }" style="height: 100%">
      <router-view />
    </div>
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

const KEY_ESCAPE = "Escape";
const KEY_ARROW_RIGHT = "ArrowRight";
const KEY_ARROW_LEFT = "ArrowLeft";

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
    const show = computed<boolean>(() => {
      return name.value.length < 3;
    });

    const shouldShowSetName = computed<boolean>(
      () => showName.value || show.value
    );

    onMounted(() => {
      bus.$on(Events.get.room.id, (key: string) => (room.value = key));
      bus.$emit(Events.statusBar.statusChange, StatusSocket.connection);
      bus.$emit(Events.statusBar.roomChange, "Отсутствует");
      bus.$on(Events.statusBar.editName, (show: boolean) => {
        showName.value = show;
      });

      connection(user, router, store);

      window.addEventListener("keyup", (event: KeyboardEvent) => {
        event.code === KEY_ESCAPE ? bus.$emit(Events.front.keyUpEsc) : "";
        event.code === KEY_ARROW_RIGHT
          ? bus.$emit(Events.front.keyUpRight)
          : "";
        event.code === KEY_ARROW_LEFT ? bus.$emit(Events.front.keyUpLeft) : "";
      });
    });

    new LS();

    return { name, room, showName, show, shouldShowSetName };
  },
};
</script>
<style scoped>
.hide {
  display: none;
}
</style>
