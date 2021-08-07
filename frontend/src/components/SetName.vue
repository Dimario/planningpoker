<template>
  <div>
    <h1>
      <template v-if="props.isEdit"> Изменение имени </template>
      <template v-else> Пожалуйста представьтесь </template>
    </h1>

    <div class="input-row">
      <input v-model="newName" placeholder="Писать сюда" />
      <button @click="setName" :disabled="disabled">OK</button>
    </div>

    <div v-if="props.isEdit" class="close">ESC</div>
  </div>
</template>
<script lang="ts">
import { computed, ref } from "vue";
import { Store, useStore } from "@/store/store";
import { Events } from "@/const";
import bus from "@/lib/bus";

interface Props {
  isEdit: boolean;
}

export default {
  name: "SetName",
  props: {
    isEdit: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: Props) {
    const store: Store = useStore();
    const name = ref<string>("");
    name.value = store.getters.name;
    const nameLength = computed(() => name.value.length);
    const newName = ref<string>("");
    const newNameLength = computed(() => newName.value.length);

    const disabled = computed<boolean>(() => {
      return newNameLength.value < 3;
    });

    const setName = (): void => {
      store.commit(Events.front.setName, newName.value);
      name.value = store.getters.name;
      localStorage["name"] = name.value;
    };

    bus.$on(Events.front.keyUpEsc, () =>
      bus.$emit(Events.statusBar.editName, false)
    );

    return { name, nameLength, newName, disabled, setName, props };
  },
};
</script>
<style scoped>
.close {
  position: fixed;
  top: 20px;
  right: 20px;
  text-transform: uppercase;
  font-size: 2em;
  color: #d8d8d8;
}
</style>
