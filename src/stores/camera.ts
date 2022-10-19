import { defineStore } from 'pinia';
import { useGame } from './game';
import { Tile, useMap } from './map';

export const useCamera = defineStore('camera', {
  state: () => ({
    viewRadius: 15,
    map: useMap(),
    game: useGame(),
  }),
  getters: {
    displayTiles(): Tile[][] {
      const coords = this.cameraCenter;

      const rowStart = coords.y - this.viewRadius;
      const rowEnd = coords.y + this.viewRadius;
      const colStart = coords.x - this.viewRadius;
      const colEnd = coords.x + this.viewRadius;

      const rows = this.map.tiles.slice(rowStart, rowEnd + 1);

      return rows.map((row) => {
        return row.slice(colStart, colEnd + 1);
      });
    },
    cameraCenter(): Coords {
      let { x, y } = this._idealCameraCenter;

      if (x < this.viewRadius) x = this.viewRadius;

      if (x > this.map.width - this.viewRadius - 1)
        x = this.map.width - this.viewRadius - 1;

      if (y < this.viewRadius) y = this.viewRadius;

      if (y > this.map.height - this.viewRadius - 1)
        y = this.map.height - this.viewRadius - 1;

      return { x, y };
    },
    // Camera center but it might be out of bounds
    _idealCameraCenter(): Coords {
      return this.game.selectedTile ?? this.map.tileAt(this.game.player);
    },
    viewCoordsForAbsCoords() {
      return (coords: Coords): Coords => {
        return {
          x: coords.x - this.cameraCenter.x + this.viewRadius,
          y: coords.y - this.cameraCenter.y + this.viewRadius,
        };
      };
    },
  },
});
