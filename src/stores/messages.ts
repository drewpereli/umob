import { defineStore } from 'pinia';

export interface GameMessage {
  content: string;
  color?: string;
}

export const useMessages = defineStore('messages', {
  state: () => ({
    messages: [] as GameMessage[],
  }),
  actions: {
    addMessage(message: GameMessage) {
      this.messages.push(message);
    },
  },
});
