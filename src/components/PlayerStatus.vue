<script lang="ts">
import { defineComponent } from 'vue';
import HealthBar from './player-status/HealthBar.vue';
import EquippedWeapon from './player-status/EquippedWeapon.vue';
import { useGame } from '@/stores/game';
import CoverIndicators from './CoverIndicators.vue';
import WeaponClipStatus from './WeaponClipStatus.vue';
import StatusEffect from './StatusEffect.vue';
import EnergyBar from './player-status/EnergyBar.vue';

export default defineComponent({
  components: {
    HealthBar,
    EquippedWeapon,
    CoverIndicators,
    WeaponClipStatus,
    EnergyBar,
    StatusEffect,
  },
  setup() {
    return { game: useGame() };
  },
  computed: {
    statusEffects() {
      return this.game.player.statusEffects;
    },
    powerHotKeys() {
      return Object.entries(this.game.player.powerHotkeys)
        .filter(([_, power]) => !!power)
        .map(([key, power]) => {
          return { key, power };
        })
        .sort((a, b) => {
          const aSort = a.key === '0' ? 10 : Number(a.key);
          const bSort = b.key === '0' ? 10 : Number(b.key);

          return aSort - bSort;
        });
    },
  },
});
</script>

<template>
  <div class="player-status">
    <HealthBar :actor="game.player" />
    <EnergyBar :actor="game.player" />
    <EquippedWeapon />
    <WeaponClipStatus :gun="game.player.equippedWeapon" />
    <CoverIndicators :covers="game.player.covers" />
    <StatusEffect
      v-for="(statusEffect, idx) in statusEffects"
      :key="idx"
      :statusEffect="statusEffect"
    />

    <div>
      <h3>Powers:</h3>
      <div v-for="powerData in powerHotKeys" :key="powerData.key">
        {{ powerData.key }}. {{ powerData.power.name }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.player-status
  width 300px
  font-family monospace
  padding 1rem
  border-radius 4px
  border 1px solid gray
  & > *
    margin-top 0.5rem
    &:first-child
      margin-top 0
</style>
