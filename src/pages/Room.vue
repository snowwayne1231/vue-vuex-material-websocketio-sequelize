<template>
  <div class="room">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>Room</span>
          </div>
          <div class="md-subhead">
            <span>{{user.nickname}}</span>
            <span>行動力: {{user.actPoint}}</span>
            <span>國家ID: {{user.countryId}}</span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class="map" @mousedown="onMouseDown($event)" @mousemove="onMouseMove($event)" @mouseup="onMouseUp()" @mouseleave="onMouseUp()">
          <div class="render" :style="{ transform: `translate(${viewX}px, ${viewY}px)` }">
            <li v-for="(p, idx) in mapData" :key="p.id+idx" class="point" :style="{left: `${p.x / 1.6}px`, top: `${p.y / 1.6}px`}" @click="onClickPoint(p)">
              <span :class="{light: showLights.includes(p.id), now: showNow==p.id}">🏠{{p.name}}</span>
              <span v-if="p.ownCountryId == user.countryId">🏴</span>
              <Man
                v-if="showNow==p.id"
                name="帥哥"
                :voted="localVoteBoolean"
              />
              <div class="list-people">
                <i v-for="(user) in usersByMapId(p.id)" :key="user.id">{{user.nickname}},</i>
              </div>
            </li>
          </div>
        </div>
        <div class="nav">
          <button @click="onClickIncreaseSoldier">徵兵</button>
          <button @click="onClickSearchWild">探索</button>
          <button @click="onClickLeaveCountry">下野</button>
          <button @click="onClickEnterCountry">入仕</button>
        </div>
        <div class="notifications">
          <li v-for="(noti) in global.notifications" :key="noti[0].getTime()">
            <span>{{noti[0].toLocaleString()}}</span><span>{{noti[1]}}</span>
          </li>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Man from '@/components/interactive/Man';
import mapAlgorithm from '@/unit/mapAlgorithm';

export default {
  name: 'Room',
  data() {
    return {
      viewX: 0,
      viewY: 0,
      showLights: [],
    }
  },
  computed: {
    ...mapState(['global', 'user']),
    mapData(self) {
      let mpas = self.global.maps;
      return mpas;
    },
    localVoteBoolean(self) {
      return self.showLights.length == 0;
    },
    showNow(self) {
      return self.user.mapNowId;
    },
  },
  components: {
    Man,
  },
  mounted() {
    if (this.user.code != 'R343') {
      window.alert('開發測試用的');
      this.$router.push('/');
    }
    this._mouse_dataset = {};
  },
  methods: {
    usersByMapId(mapId) {
      return this.global.users.filter(u => u.mapNowId == mapId);
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
    onClickPoint(dataset) {
      if (this.showLights.includes(dataset.id)) {
        let yes = window.confirm('確定移動這此嗎?');
        if (yes) {
          this.showLights = [];
          return this.$store.dispatch('actMove', dataset.id);
        }
      } else if (dataset.id == this.showNow) {
        const routes = mapAlgorithm.getAllowedPosition(dataset.id, this.user.actPoint, this.user.countryId);
        const maps = this.global.maps;
        routes.names = {};
        Object.keys(routes.steps).map(key => {
          let loc = routes.steps[key];
          let res = loc.map(mid => maps.find(e => e.id == mid)).map(e => e.name);
          routes.names[key] = res;
        })
        clog('Routes : ', routes);
        this.showLights = routes.all;
      }
    },
    onClickIncreaseSoldier() {
      const chekcs = this.getCheck([
        this.checkActPoint,
        this.checkIsOnCity,
      ]);
      if (chekcs) {
        this.$store.dispatch('actIncreaseSoldier');
      }
    },
    onClickSearchWild() {
      const chekcs = this.getCheck([
        this.checkActPoint,
        this.checkInWild,
      ]);
      if (chekcs) {
        this.$store.dispatch('actSearchWild');
      }
    },
    onClickLeaveCountry() {
      const chekcs = this.getCheck([
        this.checkActPoint,
        this.checkIsInCountry,
      ]);
      if (chekcs) {
        this.$store.dispatch('actLeaveCountry');
      }
    },
    onClickEnterCountry() {
      return this.$store.dispatch('actEnterCountry');
    },
    getCheck(ary = []) {
      return !ary.some(e => { let reason = e.apply(this); return reason.length > 0 && !window.alert(reason)});
    },
    checkActPoint(atleast = 1) {
      return this.user.actPoint >= atleast ? '' : '行動點數不足';
    },
    checkIsOnCity() {
      const mapNowId = this.user.mapNowId;
      const thisMap = this.global.maps.find(e => e.id == mapNowId);
      return thisMap && thisMap.cityId > 0 && this.user.countryId == thisMap.ownCountryId ? '' : '不在此城池';
    },
    checkInWild() {
      const mapNowId = this.user.mapNowId;
      const thisMap = this.global.maps.find(e => e.id == mapNowId);
      return thisMap && thisMap.cityId == 0 ? '' : '不在野區';
    },
    checkIsInCountry() {
      return this.user.countryId > 0 ? '' : '無所屬國家';
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
  background: #f4ffe9;
  font-size: 12px;
}
.point {
  list-style: none;
  position: absolute;
  cursor: pointer;
}
.light {
  color: blue;
}
.now {
  color: red;
}
.map .man {
  position: absolute;
  top: -44px;
  left: 20px;
}
.nav {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 60px;
  background: rgba(0,0,0,0.2);
}
.list-people {
  white-space: normal;
  width: 100px;
  color: #aaa;
  border: 1px solid #aaa;
}
.notifications {
  height: 100px;
  overflow: auto;
}
</style>