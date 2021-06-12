<template>
  <h1>
    <template v-if="props.isEdit"> Изменение имени </template>
    <template v-else> Пожалуйста представьтесь </template>
  </h1>

  <div class="input-row">
    <input v-model="newName" placeholder="Писать сюда" />
    <button @click="setName" :disabled="disabled">OK</button>
  </div>
</template>
<script lang="ts">
import { computed, ref } from "vue";
import { Store, useStore } from "@/store/store";
import { Events } from "@/const";

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

    const disabled = computed(() => {
      return newNameLength.value < 3;
    });

    const setName = () => {
      store.commit(Events.front.setName, newName.value);
      name.value = store.getters.name;
      localStorage["name"] = name.value;
    };

    return { name, nameLength, newName, disabled, setName, props };
  },
};
</script>
