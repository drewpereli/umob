<script lang="ts">
import { useMessages } from '@/stores/messages';
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    const messagesStore = useMessages();

    return { messagesStore };
  },
  computed: {
    messages() {
      return this.messagesStore.messages.slice(-10);
    },
  },
});
</script>

<template>
  <div class="game-messages">
    <div class="message" v-for="(message, idx) in messages" :key="idx">
      {{ message.content }}
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.game-messages
  width 300px
  border 1px solid gray
  z-index -1

.message
  padding 0.25rem 0.5rem
  background-color #333
  color #ddd
  &:nth-child(2n)
    background-color #555
    color #fff
</style>
