<template>
  <div class="reward">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>Reward</span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class='add-ctl'>
          <table>
            <tr>
              <th>title</th>
              <th><input type="text" v-model="title" /></th>
              <th>active Datetime: </th>
              <th><input type="date" v-model="activeDate" /></th>
            </tr>
            <tr>
              <th>content</th>
              <th><input type="text" v-model="content" /></th>
              <th colspan="2"><button @click="onClickAdd">Add</button></th>
            </tr>
          </table>
          <div class="contain-reward-list" @paste="onPaste">
            <table class="reward-list-table">
              <tr>
                <th>User</th>
                <th>add Money</th>
                <th>add Soldier</th>
                <th>add Contribution</th>
                <th width="25%">Items</th>
                <th>actPoint</th>
              </tr>
              <tr v-for="(user, idx) in listUsers" :key="user.id">
                <td :style="{color: user.color, background: user.colorbg, border: '1px solid #333'}">{{user.nickname}}</td>
                <td><input type="number" v-model.number="rewardList[idx].money"/></td>
                <td><input type="number" v-model.number="rewardList[idx].soldier"/></td>
                <td><input type="number" v-model.number="rewardList[idx].contribution"/></td>
                <td>
                  <div v-for="(item, index) in rewardList[idx].items" :key="`${item}-${idx}`">
                    <select v-model="rewardList[idx].items[index]">
                      <option :value="0">無</option>
                      <option v-for="(opt) in itemOptions" :key="opt.value" :value="opt.value">{{opt.label}}</option>
                    </select>
                  </div>
                  <div>
                    <span class="md-icon add" @click="onClickAddRewardItem(idx)">add</span>
                  </div>
                </td>
                <td><input type="number" v-model.number="rewardList[idx].point"/></td>
              </tr>
            </table>
          </div>
        </div>
        <div class='content-list'>
          <table>
            <tr>
              <th>Title</th>
              <th>Content</th>
              <th>Datetime</th>
              <th>Status</th>
              <th></th>
            </tr>
            <tr v-for="reward in showRewards" :key="reward.id" @click="onClickReward(reward)">
              <td>{{reward.title}}</td>
              <td>{{reward.content}}</td>
              <td>{{new Date(reward.datetime).toLocaleString()}}</td>
              <td>{{reward.status == 1 ? '未發送' : '已發送'}}</td>
              <td>
                <span v-if="reward.status == 1" class="md-icon save" @click="onClickSaveReward(reward, $event)">save</span>
                <span v-if="reward.status == 1" class="md-icon" @click="onClickDeleteReward(reward, $event)">close</span>
                <span v-if="reward.status == 2" class="md-icon check">check</span>
                <span v-if="reward.status == 4" class="md-icon delete">delete_forever</span>
              </td>
            </tr>
          </table>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Reward',
  data() {
    const time = new Date();
    return {
      activeDate: `${time.getFullYear()}-${String(time.getMonth()+1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`,
      title: '',
      content: '',
      rewardList: new Array(120).fill(0).map(e => {return {id: 0, money: 0, soldier: 0, contribution: 0, items: [], point: 0}}),
    }
  },
  computed: {
    ...mapState(['global', 'user']),
    listUsers(self) {
      const countryMap = {};
      self.global.countries.map(country => {
        countryMap[country.id] = country;
      });
      const uus = self.global.users.map(user => {
        const colorAry = countryMap[user.countryId] ? countryMap[user.countryId].color.split(',') : ['#a8a8a8', '#fafafa'];
        return {...user,
          color: colorAry[1],
          colorbg: colorAry[0],
        }
      });
      uus.sort((a,b) => b.countryId - a.countryId);
      return uus;
    },
    itemOptions(self) {
      return Object.values(self.global.itemMap).map(e => {
        return {
          value: e.id,
          label: e.name,
        }
      })
    },
    showRewards(self) {
      const rewards = self.global.rewards.slice();
      rewards.sort((a,b) => new Date(b.datetime) - new Date(a.datetime))
      return rewards
    }
  },
  mounted() {
    if (!['R343', 'R307', 'R064'].includes(this.user.code)) {
      window.alert('福委用的');
      return this.$router.push('/');
    }
    this.reload();
  },
  methods: {
    reload() {
      var sendto = {model: 'Reward', where: {}, attributes: ['id', 'title', 'content', 'status', 'datetime', 'json']}
      this.$store.dispatch('wsEmitADMINCTL', sendto);
    },
    onClickAdd() {
      const result = [];
      const rl = this.rewardList;
      this.listUsers.map((user, idx) => {
        const res = {...rl[idx], id: user.id, nn: user.nickname};
        if (res.soldier || res.money || res.contribution || res.items.length > 0 || res.point) {
          result.push(res);
        }
      });
      
      const create = {
        title: this.title,
        content: this.content,
        datetime: this.activeDate,
        json: JSON.stringify(result),
      }
      console.log('create: ', create);  
      if (window.confirm(`確定新增 ${create.title} 到 ${create.datetime} 嗎?`)) {
        var sendto = {model: 'Reward', create}
        this.$store.dispatch('wsEmitADMINCTL', sendto);
      }
    },
    onClickReward(reward) {
      const self = this;
      const json = JSON.parse(reward.json);
      const jsonMap = {};
      const time = new Date(reward.datetime);
      self.title = reward.title;
      self.content = reward.content;
      self.activeDate = `${time.getFullYear()}-${String(time.getMonth()+1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
      json.map(j => {
        jsonMap[j.id] = j;
      });
      self.listUsers.map((user, idx) => {
        const loc = jsonMap[user.id];
        if (loc) {
          self.rewardList[idx].money = loc.money;
          self.rewardList[idx].soldier = loc.soldier;
          self.rewardList[idx].contribution = loc.contribution;
          self.rewardList[idx].items = loc.items || [];
          self.rewardList[idx].point = loc.point || 0;
        } else {
          self.rewardList[idx].money = 0;
          self.rewardList[idx].soldier = 0;
          self.rewardList[idx].contribution = 0;
          self.rewardList[idx].items = [];
          self.rewardList[idx].point = 0;
        }
      });
    },
    onClickDeleteReward(reward, evt) {
      evt.stopPropagation();
      if (window.confirm(`確定刪除 ${reward.title} 嗎?`)) {
        const update = {
          status: 4,
        }
        const where = {id: reward.id}
        var sendto = {model: 'Reward', update, where}
        this.$store.dispatch('wsEmitADMINCTL', sendto);
        const reload = this.reload;
        window.setTimeout(reload, 1000);
      }
    },
    onClickSaveReward(reward, evt) {
      evt.stopPropagation();
      if (window.confirm(`儲存 ${reward.title} 嗎?`)) {
        const result = [];
        const rl = this.rewardList;
        this.listUsers.map((user, idx) => {
          const res = {...rl[idx], id: user.id, nn: user.nickname};
          if (res.soldier || res.money || res.contribution || res.items.length > 0 || res.point) {
            result.push(res);
          }
        });
        
        const update = {
          title: this.title,
          content: this.content,
          datetime: this.activeDate,
          json: JSON.stringify(result),
        }
        const where = {id: reward.id}
        var sendto = {model: 'Reward', update, where}
        this.$store.dispatch('wsEmitADMINCTL', sendto);
        const reload = this.reload;
        window.setTimeout(reload, 1000);
      }
    },
    onClickAddRewardItem(rewardIdx) {
      const nextRewardList = this.rewardList.slice();
      nextRewardList[rewardIdx].items = nextRewardList[rewardIdx].items.concat(0);
      this.rewardList = nextRewardList;
    },
    onPaste(evt) {
      const self = this;
      const cliphoardText = evt.clipboardData.getData('Text');
      const list = cliphoardText.split(/[\r\n]+/g).map(e => e.split(/[\t\r]+/g));
      // console.log('cliphoardText: ', cliphoardText);
      console.log('list: ', list);
      if (list[0] && list[0][0] == 'User' && list[0][1] == 'add Money') {
        evt.target.blur();
        evt.stopPropagation();
        evt.preventDefault();
        const rewardMap = {};
        list.slice(1).map(loc => {
          rewardMap[loc[0].trim()] = {
            money: parseInt(loc[1]) || 0,
            soldier: parseInt(loc[2]) || 0,
            contribution: parseInt(loc[3]) || 0,
            point: parseInt(loc[4]) || 0
          }
        });
        console.log('rewardMap: ', rewardMap);
        self.listUsers.map((user, idx) => {
          const rewd = rewardMap[user.nickname];
          if (rewd) {
            self.rewardList[idx] = {...self.rewardList[idx], ...rewd};
          }
        });
        console.log('done.');
        
      } else {
        console.log('wrong format.');
      }
    }
  },
}
</script>

<style lang="scss">
.reward {
  position: relative;

  table {
    width: 100%;
  }

  .add-ctl {
    min-height: 400px;
    
    .reward-list-table {
      th {
        border: 1px solid #333;
      }
      >tr:nth-child(odd) {
        background: #ebfdff;
      }
      .add {
        cursor: pointer;
        border-radius: 50%;
        &:hover {
          color: #fff;
          background-color: #666;
        }
      }
    }
  }
  .contain-reward-list {
    max-height: 400px;
    overflow: auto;
    input {
      background: none;
      border: none;
      outline: none;
    }
  }

  .content-list {
    height: 320px;
    overflow: auto;

    table {
      tr {
        &:hover {
          background-color: #ccc;
        }
      }
    }
  }
}

</style>