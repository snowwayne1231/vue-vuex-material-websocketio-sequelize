<template>
  <div class="room">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>{{user.nickname}} </span>
          </div>
          <div class="md-subhead">
            <span>行動力: ( {{user.actPoint}} ) </span>
            <span>國家: ⚑[ {{myCountry.name}} ]⚑ </span>
            <span>金: {{user.money}} 💰 </span>
            <span>兵: {{user.soldier}} ⚔️ </span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class="map" @mousedown="onMouseDown($event)" @mousemove="onMouseMove($event)" @mouseup="onMouseUp()" @mouseleave="onMouseUp()">
          <div class="render" :style="{ transform: `translate(${viewX}px, ${viewY}px)` }">
            <li v-for="(p, idx) in mapData" :key="p.id+idx" class="point" :style="{left: `${p.x / 1.6}px`, top: `${p.y / 1.6}px`}" @click="onClickPoint(p)">
              <span :class="{light: showLights.includes(p.id), now: showNow==p.id, battle: showBattle.includes(p.id)}">🏠{{p.name}}</span>
              <span v-if="p.ownCountryId == user.countryId">🏴</span>
              <Man
                v-if="showNow==p.id"
                name="帥哥"
                :voted="localVoteBoolean"
              />
              <div class="list-people">
                <i v-for="(user) in usersByMapId(p.id)" :key="user.id">{{user.nickname}},</i>
              </div>
              <div class="battlearea" v-if="p.battlearea">
                <i class="icon">🔥</i>
                <table class="table">
                  <tr>
                    <td colspan="2">{{p.battlearea.time}}</td>
                  </tr>
                  <tr>
                    <td>{{p.battlearea.atkCountry}}</td>
                    <td>{{p.battlearea.defCountry}}</td>
                  </tr>
                  <tr>
                    <td>
                      <dl v-for="(user, idx) in p.battlearea.atkUsers" :key="idx">
                        <dd v-if="user">{{user.nickname}}</dd>
                        <dd v-else @click="onClickJoin($event, idx, p.id, p.battlearea.id)">[+]</dd>
                      </dl>
                    </td>
                    <td>
                      <dl v-for="(user, idx) in p.battlearea.defUsers" :key="idx">
                        <dd v-if="user">{{user.nickname}}</dd>
                        <dd v-else @click="onClickJoin($event, idx, p.id, p.battlearea.id)">[+]</dd>
                      </dl>
                    </td>
                  </tr>
                </table>
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
        <div class="dialog" v-if="isOpenBattlePanel">
          <table>
            <tbody>
              <tr>
                <td colspan="3">{{battlefieldData.mapName}}</td>
              </tr>
              <tr>
                <td>{{battlefieldData.atkName}}</td>
                <td></td>
                <td>{{battlefieldData.defName}}</td>
              </tr>
              <tr>
                <td>💂‍♂{{1}}</td>
                <td>>>> ⚔️ >>></td>
                <td>💂‍♂{{battlefieldData.defUsers.length}}</td>
              </tr>
              <tr>
                <td>👪{{battlefieldData.atkSoldier}}</td>
                <td></td>
                <td>👪{{battlefieldData.defSoldier}}</td>
              </tr>
              <tr>
                <td colspan="3">
                  <select v-model="battleTimeSelected">
                    <option :value="-1">未選擇</option>
                    <option v-for="(opt, idx) in battlefieldData.timeOptions" :key="idx" :value="idx">{{opt}}</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td><button @click="onClickCancelBattle">取消</button></td>
                <td></td>
                <td><button v-if="battleTimeSelected>=0" @click="onClickBattle">確定出征</button></td>
              </tr>
            </tbody>
          </table>
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
      showBattle: [],
      battleTimeSelected: -1,
    }
  },
  computed: {
    ...mapState(['global', 'user']),
    mapData(self) {
      let mpas = self.global.maps.map(m => {
        let next = {...m};
        let areaData = self.global.battlefieldMap[next.id];
        if (areaData) {
          let countries = self.global.countries;
          let users = self.global.users;
          next.battlearea = {
            id: areaData.id,
            time: new Date(areaData.timestamp).toLocaleString(),
            atkCountry: areaData.attackCountryIds.map(ac => countries.find(c => ac==c.id).name).join(','),
            defCountry: countries.find(c => areaData.defenceCountryId==c.id).name,
            judge: areaData.judgeId > 0 ? users.find(u => u.id == areaData.judgeId).nickname : '',
            toolman: areaData.toolmanId > 0 ? users.find(u => u.id == areaData.toolmanId).nickname : '',
            atkUsers: areaData.atkUserIds.map(u => u > 0 ? users.find(uu => uu.id == u) : null),
            defUsers: areaData.defUserIds.map(u => u > 0 ? users.find(uu => uu.id == u) : null),
          }
        }
        return next;
      });
      return mpas;
    },
    localVoteBoolean(self) {
      return self.showLights.length == 0;
    },
    showNow(self) {
      return self.user.mapNowId;
    },
    myCountry(self) {
      return self.global.countries.find(c => c.id == self.user.countryId) || {};
    },
    isOpenBattlePanel(self) {
      return self.global.battlefield.mapId > 0;
    },
    battlefieldData(self) {
      const bdata = self.global.battlefield;
      const mapData = self.global.maps.find(m => m.id == bdata.mapId) || {};
      const defCountry = self.global.countries.find(c => c.id == mapData.ownCountryId);
      const atkCountry = self.global.countries.find(c => c.id == self.user.countryId);
      const atkUsers = self.global.users.filter(u => u.mapNowId == self.user.mapNowId && u.countryId == atkCountry.id);
      const togetherSoldier = atkUsers.reduce((a, b) => a+b.soldier, 0);
      const defUsers = self.global.users.filter(u => u.mapNowId == bdata.mapId && u.countryId == defCountry.id);
      const defSoldier = defUsers.reduce((a, b) => a+b.soldier, 0);
      return {
        mapName: mapData.name,
        timeOptions: bdata.timeOptions.map(t => new Date(t).toLocaleString()),
        atkName: atkCountry.name,
        atkSoldier: `${self.user.soldier} - ${togetherSoldier}`,
        defName: defCountry.name,
        defSoldier,
        atkUsers,
        defUsers,
      }
    },
  },
  components: {
    Man,
  },
  mounted() {
    if (window.location.hostname != 'localhost' && !['R343', 'R064', 'R307'].includes(this.user.code)) {
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
          this.showBattle = [];
          return this.$store.dispatch('actMove', dataset.id);
        }
      } else if (dataset.id == this.showNow) {
        if (this.localVoteBoolean) {
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

          const battleIds = mapAlgorithm.getBattlePosition(dataset.id, this.user.countryId);
          this.showBattle = battleIds;
        } else {
          this.showLights = [];
          this.showBattle = [];
        }
      } else if (this.showBattle.includes(dataset.id)) {
        let yes = window.confirm('確定攻打這裡嗎?');
        if (yes) {
          this.showLights = [];
          this.showBattle = [];
          return this.$store.dispatch('actBattle', { mapId: dataset.id });
        }
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
    onClickCancelBattle() {
      const nextBattlefield = {...this.global.battlefield};
      nextBattlefield.mapId = 0;
      nextBattlefield.timeOptions = [];
      this.battleTimeSelected = -1;
      this.$store.commit('updateGlobal', {battlefield: nextBattlefield});
    },
    onClickBattle() {
      const battlefield = this.global.battlefield;
      const idx = this.battleTimeSelected;
      if (idx >= 0) {
        const selectedTime = battlefield.timeOptions[idx];
        console.log(selectedTime);
        this.$store.dispatch('actBattle', {mapId: battlefield.mapId, time: selectedTime});
      }
    },
    onClickJoin(evt, index, mapId, battleId) {
      console.log(index, mapId, battleId);
      evt.stopPropagation();
      if (window.confirm(`確定加入 [ ${this.global.maps.find(m => m.id == mapId).name} ] 的戰役嗎 ?`)) {
        return this.$store.dispatch('actBattleJoin', {position: index, mapId, battleId});
      }
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
  color: #00cb22;
}
.battle {
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
  background-color: #010600;
  color: #fff;
  box-sizing: border-box;
}
.dialog {
  position: absolute;
  background-color: #fff;
  top: 60px;
  left: 24vw;
  width: 42vw;
  text-align: center;
  border-radius: 20px;
  border: 2px #dfb63d  outset;
  box-sizing: border-box;
  padding: 16px;
}
.dialog table {
  width: 100%;
}
.dialog table td{
  width: 33%;
}
.battlearea {
  position: absolute;
  width: 100%;
  background-color: #ffd456;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  z-index: 2;
}
.battlearea .table {
  display: none;
}
.battlearea:hover .table{
  display: block;
}
.battlearea dl, .battlearea dd {
  margin: 0px;
}
</style>