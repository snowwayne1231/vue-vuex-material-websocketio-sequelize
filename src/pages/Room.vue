<template>
  <div class="room">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>Room</span>
          </div>
          <div class="md-subhead">
            <span>Sub</span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class="map" @mousedown="onMouseDown($event)" @mousemove="onMouseMove($event)" @mouseup="onMouseUp()" @mouseleave="onMouseUp()">
          <div class="render" :style="{ transform: `translate(${viewX}px, ${viewY}px)` }">
            <li v-for="(p, idx) in mapData" :key="idx" class="point" :style="{left: `${p.x}px`, top: `${p.y}px`}" @click="onClickPoint(p)">
              <span>🏠{{p.name}}</span>
              <!-- <Man 
                name="first-man"
                :voted="localVoteBoolean"
                @click="onClickMan"
              /> -->
            </li>
          </div>
        </div>
        
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Man from '@/components/interactive/Man';

export default {
  name: 'Room',
  data() {
    return {
      localVoteBoolean: false,
      viewX: 0,
      viewY: 0,
    }
  },
  computed: {
    ...mapState(['global']),
    mapData(self) {
      let mpas = self.global.maps;
      return mpas;
    },
  },
  components: {
    Man,
  },
  mounted() {
    this._mouse_dataset = {};
  },
  methods: {
    onClickMan() {
      this.localVoteBoolean = !this.localVoteBoolean;
    },
    onMouseDown(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      this._mouse_dataset = {start: {x,y}, go: true, origin: {x: this.viewX, y: this.viewY}};
    },
    onMouseUp() {
      this._mouse_dataset.go = false;
    },
    onMouseMove(evt) {
      var md = this._mouse_dataset || {};
      if (md.go) {
        var x = evt.clientX;
        var y = evt.clientY;
        var moveX = x - md.start.x + md.origin.x;
        var moveY = y - md.start.y + md.origin.y;
        moveX = Math.max(moveX, - 2800 + window.innerWidth - 152);
        moveX = Math.min(moveX, 0);
        moveY = Math.max(moveY, - 2200 + window.innerHeight - 152);
        moveY = Math.min(moveY, 0);
        this.viewX = moveX;
        this.viewY = moveY;
      }
    },
    onClickPoint(evt) {
      console.log('onClickPoint evt: ', evt);
      this.$store.dispatch('actMove', ['wwe', evt]);
    },
  },
}
</script>



<style lang="scss" scoped>
.map {
  position: relative;
  width: calc(100vw - 154px);
  height: 720px;
  overflow: hidden;
}
.render {
  width: 2800px;
  height: 2200px;
  // transition: all 0.2s linear;
  background: chartreuse;
}
.point {
  list-style: none;
  position: absolute;
}
</style>