<template>
  <div>
    <h1>
      <template v-if="props.isEdit"> Изменение имени </template>
      <template v-else> Пожалуйста представьтесь </template>
    </h1>

    <div class="input-row">
      <input v-model="newName" placeholder="Писать сюда" />
      <button :disabled="disabled" @click="setName">OK</button>
    </div>

    <div v-if="props.isEdit" class="close">ESC</div>
  </div>
</template>
<script lang="ts">
import { computed, ref } from "vue";
import { Store, useStore } from "../store/store";
import { Events } from "../const";
import bus from "../lib/bus";
import { IUser } from "../../../interfaces/iuser";

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
    const name = computed<string>(() => store.getters.name);
    const me = computed<IUser>(() => store.getters.me);
    const nameLength = computed<number>(() => name.value.length);
    const newName = ref<string>(me.value ? me.value.name : "");
    const newNameLength = computed<number>(() =>
      newName.value ? newName.value.length : 0
    );

    const disabled = computed<boolean>(() => newNameLength.value < 3);

    const setName = (): void => {
      store.commit(Events.front.setName, newName.value);

      if (props.isEdit) {
        bus.$emit(Events.server.changeName, { ...me.value, name: name.value });
      }

      bus.$emit(Events.statusBar.editName);
      localStorage["name"] = name.value;
    };

    bus.$on(Events.front.keyUpEsc, () =>
      bus.$emit(Events.statusBar.editName, !props.isEdit)
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
