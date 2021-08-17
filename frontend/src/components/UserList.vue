<template>
  <div v-if="$props.users" class="users">
    <div v-for="item in $props.users" :key="item.id" class="user">
      <template v-if="$props.needShowBalance">
        <div v-if="$props.balance" class="balance">
          {{ item.balance }}
        </div>
        <div v-else class="balance">*</div>
      </template>
      <div class="name">{{ item.name }}</div>
    </div>
  </div>
</template>
<script lang="ts">
import { IUser } from "../../../interfaces/iuser";
import { PropType } from "vue";

interface Props {
  users: IUser[];
  needShowBalance: boolean;
  balance: boolean;
}

export default {
  name: "UserList",
  props: {
    users: {
      type: Array as PropType<IUser[]>,
      default: () => [],
    },
    needShowBalance: {
      type: Boolean,
      default: false,
    },
    balance: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: Props) {
    return {
      props,
    };
  },
};
</script>
