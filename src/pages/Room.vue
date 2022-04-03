<template>
  <div class="room">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>{{user.nickname}} </span>
          </div>
          <div class="md-subhead">
            <span>行動力: ( {{user.actPoint}} ) | </span>
            <span>國家: ⚑[ {{myCountry.name}} ]⚑ | </span>
            <span>金: {{user.money}} 💰 | </span>
            <span>兵: {{user.soldier}} ⚔️ | </span>
            <span>貢獻: {{user.contribution}} ❤️ | </span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class="map" @mousedown="onMouseDown($event)" @mousemove="onMouseMove($event)" @mouseup="onMouseUp()" @mouseleave="onMouseUp()">
          <div class="render" :style="{ transform: `translate(${viewX}px, ${viewY}px)` }">
            <li v-for="(p, idx) in mapData" :key="p.id+idx" class="point" :style="{left: `${p.x / 1.4}px`, top: `${p.y / 1.4}px`}" @click="onClickPoint(p)">
              <span :class="{light: showLights.includes(p.id), now: showNow==p.id, battle: showBattle.includes(p.id)}">🏠{{p.name}}</span>
              <dd class="person-zone" v-if="p.users.length > 0"><span class="md-icon person">person</span><i>{{p.users.length}}</i></dd>
              <span v-if="p.color" class="md-icon flag" :style="{color: p.color}">flag</span>
              <Man
                v-if="showNow==p.id"
                :name="user.nickname"
                :voted="localVoteBoolean"
              />
              <div class="battlearea" v-if="p.battlearea">
                <i class="icon">🔥{{p.battlearea.gameName}}🔥</i>
                <table class="table">
                  <tr>
                    <td colspan="2">{{p.battlearea.time}}</td>
                  </tr>
                  <tr>
                    <th width="50%">{{p.battlearea.atkCountry}}</th>
                    <th width="50%">{{p.battlearea.defCountry}}</th>
                  </tr>
                  <tr>
                    <td>
                      <dl v-for="(user, idx) in p.battlearea.atkUsers" :key="idx">
                        <dd v-if="user">{{user.nickname}} {{p.battlearea.detail.atkSoldiers[idx]}}</dd>
                        <dd v-else @click="onClickJoin($event, idx, p.id, p.battlearea.id)">[+]</dd>
                      </dl>
                    </td>
                    <td>
                      <dl v-for="(user, idx) in p.battlearea.defUsers" :key="idx">
                        <dd v-if="user">{{user.nickname}} {{p.battlearea.detail.defSoldiers[idx]}}</dd>
                        <dd v-else @click="onClickJoin($event, idx, p.id, p.battlearea.id)">[+]</dd>
                      </dl>
                    </td>
                  </tr>
                  <tr>
                    <td>裁判: </td>
                    <td><dd v-if="p.battlearea.judge">{{p.battlearea.judge}}</dd><dd v-else @click="onClickJoin($event, 4, p.id, p.battlearea.id)">[+]</dd></td>
                  </tr>
                  <tr>
                    <td>工作: </td>
                    <td><dd v-if="p.battlearea.toolman">{{p.battlearea.toolman}}</dd><dd v-else @click="onClickJoin($event, 5, p.id, p.battlearea.id)">[+]</dd></td>
                  </tr>
                  <tr>
                    <td><dd class="btn" @click="onClickJudgeWin($event, p.battlearea.atkCountryId, p.id, p.battlearea.id)">攻成</dd></td>
                    <td><dd class="btn" @click="onClickJudgeWin($event, p.battlearea.defCountryId, p.id, p.battlearea.id)">守贏</dd></td>
                  </tr>
                </table>
              </div>
            </li>
          </div>
        </div>
        <div class="nav">
          <button @click="onClickMove">移動</button>
          <button @click="onClickIncreaseSoldier">徵兵</button>
          <button @click="onClickSearchWild">探索</button>
          <button @click="onClickLeaveCountry">下野</button>
          <button @click="onClickEnterCountry">入仕</button>
          <button @click="onClickBusiness">商業</button>
          <button @click="onClickAssignment">任命</button>
          <button @click="onClickLevelUp('barrack')">升軍營</button>
          <button @click="onClickLevelUp('market')">升市場</button>
          <button @click="onClickLevelUp('stable')">升馬廄</button>
          <button @click="onClickLevelUp('wall')">升城牆</button>
          <button @click="openSharePanel = true">配給</button>
          <button @click="onClickEscape">逃脫</button>
          <button @click="onClickWarHistory">歷史戰役</button>
        </div>
        <div class="notifications">
          <ul>
            <li v-for="(msg) in global.domesticMessages" :key="msg[0].getTime()">
              <span>{{msg[0].toLocaleString()}}</span><span>{{msg[1]}}</span>
            </li>
          </ul>
          <ul>
            <li v-for="(noti) in global.notifications" :key="noti[0].getTime()">
              <span>{{noti[0].toLocaleString()}}</span><span>{{noti[1]}}</span>
            </li>
          </ul>
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
        <Assignment v-if="openAssignment"
          title="任命官吏"
          :positions="global.occupationMap"
          :candidates="asCandidates"
          :clickClose="onClicAssignmentkClose"
        />
        <div class="mask" v-if="selectedCityName" @click="selectedCityName = ''">
          <CityPanel :cityName="selectedCityName" :cityId="selectedShowCityInfo" />
        </div>
        <div class="mask" v-if="openSharePanel" @click="openSharePanel = false">
          <div @click="$event.stopPropagation()" class="basic-dialog">
            <table>
              <tr>
                <th></th>
                <th>金</th>
                <th>兵</th>
              </tr>
              <tr>
                <td>
                  <select v-model="shareData.userId">
                  <option value="0">無</option>
                  <option v-for="(user) in asCandidates" :key="user.id" :value="user.id">{{user.name}}</option>
                </select>
              </td>
                <td><input type="number" v-model.number="shareData.money" /></td>
                <td><input type="number" v-model.number="shareData.soldier" /></td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td><button @click="onClickShare">配</button></td>
              </tr>
            </table>
          </div>
        </div>
        <div class="mask" v-if="openHistoryWars" @click="openHistoryWars = false">
          <div @click="$event.stopPropagation()" class="basic-dialog">
            <ul class="history-wars" style="height: 500px; overflow: auto;">
              <li v-for="war in warRecords" :key="war.id">
                <span>{{war.time}} - {{war.map.name}}之戰</span> | 
                <span>{{war.atkCountry.name}}</span> V.S 
                <span>{{war.defCountry.name}}</span>
                <span v-if="war.isAtkWin">⚔️</span>
                <span v-else>🛡️</span>
                <span>獲勝方：【<i :style="{color: war.winCountry.color.split(',')[0]}">{{war.winCountry.name}}</i>】 </span>
              </li>
            </ul>
          </div>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Man from '@/components/interactive/Man';
import Assignment from '@/components/interactive/Assignment';
import CityPanel from '@/components/interactive/CityPanel';
import mapAlgorithm from '@/unit/mapAlgorithm';
// import enums from '../enum';

export default {
  name: 'Room',
  data() {
    return {
      viewX: 0,
      viewY: 0,
      showLights: [],
      showBattle: [],
      battleTimeSelected: -1,
      openAssignment: false,
      selectedShowCityInfo: 0,
      selectedCityName: '',
      openSharePanel: false,
      openHistoryWars: false,
      shareData: {
        userId: 0,
        money: 0,
        soldier: 0,
      }
    }
  },
  computed: {
    ...mapState(['global', 'user']),
    mapData(self) {
      let mpas = self.global.maps.map(m => {
        let next = {...m};
        let areaData = self.global.battlefieldMap[next.id];
        let country = next.ownCountryId > 0 ? self.global.countries.find(c => c.id == next.ownCountryId) : null;
        let users = self.global.users.filter(u => u.mapNowId == m.id);
        if (areaData) {
          let countries = self.global.countries;
          let users = self.global.users;
          let detail = areaData.detail;
          let atkUsers = areaData.atkUserIds.map(u => u > 0 ? users.find(uu => uu.id == u) : null);
          let defUsers = areaData.defUserIds.map(u => u > 0 ? users.find(uu => uu.id == u) : null);

          next.battlearea = {
            id: areaData.id,
            time: new Date(areaData.timestamp).toLocaleString(),
            atkCountry: areaData.attackCountryIds.map(ac => countries.find(c => ac==c.id).name).join(','),
            atkCountryId: areaData.attackCountryIds[0],
            defCountry: countries.find(c => areaData.defenceCountryId==c.id).name,
            defCountryId: areaData.defenceCountryId,
            judge: areaData.judgeId > 0 ? users.find(u => u.id == areaData.judgeId).nickname : '',
            toolman: areaData.toolmanId > 0 ? users.find(u => u.id == areaData.toolmanId).nickname : '',
            atkUsers,
            defUsers,
            gameName: areaData.gameId > 0 ? self.global.gameMap[areaData.gameId].name : '未定',
            detail
          }
          
        }
        if (country) {
          next.color = country.color.split(',')[0];
        }
        next.users = users && users.length > 0 ? users : [];
        return next;
      });
      return mpas;
    },
    localVoteBoolean(self) {
      return self.showLights.length == 0 && self.showBattle.length == 0;
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
    asCandidates(self) {
      const myCountryId = self.user.countryId;
      return self.global.users.filter(u => u.countryId == myCountryId && u.role == 2 && u.id != self.user.id).map(user => {
        return {
          id: user.id,
          name: user.nickname,
          contribution: user.contribution,
          occupationId: user.occupationId,
        }
      });
    },
    warRecords(self) {
      const mapMap = {}
      self.global.maps.map(m => {
        mapMap[m.id] = m;
      });
      const countryMap = {}
      self.global.countries.map(c => {
        countryMap[c.id] = c;
      });
      return self.global.warRecords.map(w => {
        const _ = '';
        return {
          id: w.id,
          time: new Date(w.timestamp).toLocaleString(),
          map: mapMap[w.mapId],
          winCountry: countryMap[w.winnerCountryId] || {},
          atkCountry: countryMap[w.attackCountryIds[0]] || {},
          defCountry: countryMap[w.defenceCountryId] || {},
          isAtkWin: w.winnerCountryId != w.defenceCountryId,
        };
      })
    }
  },
  components: {
    Man, Assignment, CityPanel,
  },
  mounted() {
    if (!['81', '8080', '12022'].includes(window.location.port) && !['R343'].includes(this.user.code)) {
      window.alert('開發測試用的');
      this.$router.push('/');
    }
    this._mouse_dataset = {};
    console.log('store: ', this.$store);
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
    onClickMove() {
      if (this.user.mapTargetId != 0) {return false;}
      if (this.localVoteBoolean) {
        const routes = mapAlgorithm.getAllowedPosition(this.user.mapNowId, this.user.actPoint, this.user.countryId);
        const maps = this.global.maps;
        routes.names = {};
        Object.keys(routes.steps).map(key => {
          let loc = routes.steps[key];
          let res = loc.map(mid => maps.find(e => e.id == mid)).map(e => e.name);
          routes.names[key] = res;
        })
        clog('Routes : ', routes);
        this.showLights = routes.all;
        const battleIds = mapAlgorithm.getBattlePosition(this.user.mapNowId, this.user.countryId);
        this.showBattle = battleIds;
      } else {
        this.showLights = [];
        this.showBattle = [];
      }
    },
    onClickPoint(dataset) {
      console.log('onClickPoint: ', dataset);
      if (this.showLights.includes(dataset.id)) {
        let yes = window.confirm('確定移動這此嗎?');
        if (yes) {
          this.showLights = [];
          this.showBattle = [];
          return this.$store.dispatch('actMove', dataset.id);
        }
      } else if (this.showBattle.includes(dataset.id)) {
        let yes = window.confirm('確定攻打這裡嗎?');
        if (yes) {
          this.showLights = [];
          this.showBattle = [];
          return this.$store.dispatch('actBattle', { mapId: dataset.id });
        }
      }
      this.selectedShowCityInfo = dataset.cityId;
      this.selectedCityName = dataset.name;
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
        const soldier = parseInt(window.prompt('請輸入要出征的兵力:'));
        console.log(soldier);
        this.$store.dispatch('actBattle', {mapId: battlefield.mapId, time: selectedTime, soldier});
      }
    },
    onClickJoin(evt, index, mapId, battleId) {
      console.log(index, mapId, battleId);
      evt.stopPropagation();
      const mapName = this.global.maps.find(m => m.id == mapId).name;
      let yes = false;
      let soldier = 0;
      switch (index) {
        case 4: yes = window.confirm(`確定成為 [ ${mapName} ] 之戰役的裁判嗎 ?`); break;
        case 5: yes = window.confirm(`確定成為 [ ${mapName} ] 之戰役的工具人嗎 ?`); break;
        default:
          yes = window.confirm(`確定加入 [ ${mapName} ] 的戰役嗎 ?`);
          soldier = parseInt(window.prompt('請輸入要派出的兵力'), 10);
      }
      if (yes) {
        return this.$store.dispatch('actBattleJoin', {position: index, mapId, battleId, soldier});
      }
    },
    onClickJudgeWin(evt, winId, mapId, battleId) {
      console.log(winId, mapId, battleId);
      evt.stopPropagation();
      const mapName = this.global.maps.find(m => m.id == mapId).name;
      const countryName = this.global.countries.find(c=> c.id ==winId).name;
      const yes = window.confirm(`是否判定 [ ${mapName}} ] 之戰役的勝利方為 [ ${countryName} ] 嗎 ?`);
      if (yes) {
        return this.$store.dispatch('actBattleJudge', {winId, mapId, battleId});
      }
    },
    onClickBusiness() {
      return this.$store.dispatch('actBusiness');
    },
    onClickAssignment() {
      this.openAssignment = true;
    },
    onClicAssignmentkClose() {
      this.openAssignment = false;
    },
    onClickLevelUp(place) {
      const _map = this.global.maps.find(m => m.id == this.user.mapNowId);
      const _city = this.global.cities.find(c => c.id == _map.cityId);
      if (_city && _city.jsonConstruction) {
        const _data = _city.jsonConstruction[place];
        const lv = _data.lv + 1;
        const price = lv * 300;
        console.log('_data: ', _data);
        if (window.confirm(`是否花費 ${price} 升級?` )) {
          this.$store.dispatch('actLevelUpCity', { cityId: _city.id, constructionName: place });
        }
      } else {
        console.log('onClickLevelUp _city: ', _city);
      }
    },
    onClickShare() {
      console.log('onClickShare: ', this.shareData);
      if (this.shareData.userId) {
        this.$store.dispatch('actShare', this.shareData);
      }
    },
    onClickEscape() {
      const money = parseInt(window.prompt('請輸入要花多少黃金: ', 0));
      this.$store.dispatch('actEscape', {money});
    },
    onClickWarHistory() {
      this.openHistoryWars = true;
      console.log(this.global.warRecords);
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
  min-width: 96px;
  border-bottom: 1px solid #ccc;
  background: rgba(5,5,5,0.1);
  text-align: left;

  .flag {
    position: absolute;
    display: inline-block;
    left: 0px;
    top: -15px;
    text-shadow: 1px 1px 2px #000;
  }
  .person-zone {
    position: relative;
    float: right;
    >i {
      position: absolute;
      right: -6px;
      top: -6px;
      background-color: rgba(0,0,0,0.6);
      color: #fff;
      border-radius: 50%;
      width: 14px;
      line-height: 14px;
      text-align: center;
    }
  }

  .person {
    
    color: #000;
  }
}
.point:hover {
  background: rgba(5,5,5,0.3);
  z-index: 3;
}
.point:hover .list-people {
  max-height: none;
  color: #fff;
  background-color: #6ebd32;
}
.light {
  color: blue;
}
.now {
  color: #a98941;
  font-size: 2em;
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
.notifications {
  height: 100px;
  overflow: hidden;
  background-color: #010600;
  color: #fff;
  box-sizing: border-box;
  >ul {
    width: 50%;
    list-style: none;
    margin: 0px;
    padding: 5px;
    float: left;
    overflow: auto;
    height: 100%;
  }
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
  color: #222;
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
.battlearea .btn{
  background-color: #ccc;
}
.basic-dialog {
  width: 600px;
  margin: 40px auto;
  min-height: 240px;
  color: #fff;
  background-color: #22222266;
  border: 3px outset #d7cd36;

  table {
    width: 100%;
  }
}
.history-wars {
  list-style: none;
  margin: 0px;
  text-align: left;

  >li {
    cursor: pointer;
    &:hover {
      background-color: #666;
    }
  }
}
</style>