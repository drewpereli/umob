<script lang="ts">
import { defineComponent } from 'vue';
import HealthBar from './player-status/HealthBar.vue';
import EquippedWeapon from './player-status/EquippedWeapon.vue';
import { useGame } from '@/stores/game';
import CoverIndicators from './CoverIndicators.vue';
import WeaponClipStatus from './WeaponClipStatus.vue';
import StatusEffect from './StatusEffect.vue';
import { weaponIsGun } from '@/entities/weapons/gun';
import RadiationIndicator from './RadiationIndicator.vue';
import PowerStatus from './player-status/PowerStatus.vue';

export default defineComponent({
  components: {
    HealthBar,
    EquippedWeapon,
    CoverIndicators,
    WeaponClipStatus,
    StatusEffect,
    RadiationIndicator,
    PowerStatus,
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
    playerGun() {
      const equipped = this.game.player.equippedWeapon;

      if (!equipped) return;

      if (!weaponIsGun(equipped)) return;

      return equipped;
    },
  },
});
</script>

<template>
  <div class="player-status">
    <HealthBar :actor="game.player" />

    <RadiationIndicator :rads="game.player.rads" />

    <div>Upgrade points: {{ game.player.upgradePoints }}</div>

    <div>View Range: {{ game.player.viewRange }}</div>
    <div>Accuracy: {{ game.player.accuracy }}</div>

    <div v-if="game.player.armor">Armor: {{ game.player.armor }}</div>

    <EquippedWeapon />

    <div
      v-for="(wearable, idx) in game.player.equippedWearablesArray"
      :key="idx"
    >
      <div>{{ wearable.name }}</div>
    </div>

    <WeaponClipStatus v-if="playerGun" :gun="playerGun" />
    <CoverIndicators :covers="game.player.covers" />
    <StatusEffect
      v-for="(statusEffect, idx) in statusEffects"
      :key="idx"
      :statusEffect="statusEffect"
    />

    <div class="powers-container">
      <h3>Powers:</h3>
      <PowerStatus
        v-for="powerData in powerHotKeys"
        :key="powerData.key"
        :hotKey="powerData.key"
        :power="powerData.power"
      />
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

  .rads
    color lime

.powers-container > *
  margin-top 1rem
  &:first-child
    margin-top 0rem
</style>
