<template>
  <div class="users" v-if="$props.users">
    <div v-for="item in $props.users" :key="item.id" class="user">
      <template v-if="$props.needShowBalance">
        <div class="balance" v-if="$props.balance">
          {{ item.balance }}
        </div>
        <div class="balance" v-else>*</div>
      </template>
      <div class="name">{{ item.name }}</div>
    </div>
  </div>
</template>
<script lang="ts">
import { Users } from "../interfaces/User";
import { PropType } from "vue";

interface Props {
  users: Users;
  needShowBalance: boolean;
  balance: boolean;
}

export default {
  name: "UserList",
  props: {
    users: Object as PropType<Users>,
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
