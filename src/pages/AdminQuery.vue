<template>
  <div class="room">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>AdminQuery</span>
          </div>
          <div class="md-subhead">
            <div class="funcatinal-btns">
                <button @click="onClickRefreshGlobal">Refresh Global</button>
                <button @click="onClickCheckWeek">Check Week</button>
            </div>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class='global-content'>
            
            <div @click="onClickData(user, 'user')" class="home-datas"><p><span class="content-key">{{user.code}}-{{user.nickname}}</span> mapNowId: [{{user.mapNowId}}] actPoint: [{{user.actPoint}}]</p></div>
            <div v-for="(val, k) in global" :key="k" @click="onClickData(val, k)" class="home-datas">
                <p><span class="content-key">{{k}} </span><span>({{val.length}})</span></p>
            </div>
        </div>
        <div class="global-data">
          <li v-for="(data, idx) in showdata" :key="data ? data.id : ('idx-'+idx)" @click="onClickLi(data)" :class="{selected: selectedId==data.id}"><span>[{{idx}}] {{data}}</span></li>
        </div>
        <div class="db-ctl">
            <table>
                <tbody>
                    <tr>
                        <th>欄位</th>
                        <th>ID</th>
                        <th :style="{color: selectedId > 0 ? '#c5c5c5' : '#000'}">Where</th>
                        <th>Update</th>
                        <th>BTN</th>
                    </tr>
                    <tr>
                        <td><label>Table:</label><input type="text" v-model="selectedTable" /></td>
                        <td><label>ID:</label><input type="text" v-model="selectedId" /></td>
                        <td><textarea v-model="where" style="height: 80px; width: 240px;" @click="selectedId = 0"></textarea></td>
                        <td><textarea v-model="updatedata" style="height: 80px; width: 480px;"></textarea></td>
                        <td><button @click="onClickUpdateSubmit">Submit</button></td>
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
import axios from 'axios';

export default {
  name: 'AdminQuery',
  data() {
    return {
        selectedTable: '',
        selectedId: 0,
        where: '',
        updatedata: '',
        showdata: []
    }
  },
  computed: {
    ...mapState(['global', 'user']),
  },
  mounted() {
    const authorizedCodes = ['R001', 'R343', 'R307', 'R064']
    if (!authorizedCodes.includes(this.user.code.toUpperCase())) {
        location.href = '/';
    }
  },
  methods: {
    onClickData(data, key = 'user') {
        console.log(data);
        if (key == 'user') {
            // this.showdata = Object.values(data);
            this.selectedTable = 'User';
            this.showdata = [data];
        } else {
            this.showdata = data;
            switch (key) {
                case 'maps': this.selectedTable = 'Map'; break
                case 'users': this.selectedTable = 'User'; break
                case 'cities': this.selectedTable = 'City'; break
                case 'countries': this.selectedTable = 'Country'; break
                default:
            }
        }
        
    },
    onClickRefreshGlobal() {
        this.$store.dispatch('wsEmitAuthorize', 'refreshByAdmin')
    },
    onClickLi(data) {
        this.selectedId = data.id;
    },
    onClickCheckWeek() {
        axios.post(this.user.location + '/checkweek').then(e => {
            console.log(e);
        })
    },
    parseStrToObject(str) {
        var splitedLine = str.split(/[\r\n]+/gi);
        var eq = /[\=\:]/ig;
        var res = {};
        splitedLine.map(line => {
            if (line.match(eq)) {
                var ary = line.split(/\s*[\=\:]+\s*/ig);
                var key = ary[0];
                var val = ary[1];
                res[key] = val;
            }
        });
        console.log(res);
        return res;
    },
    onClickUpdateSubmit() {
        var where = this.parseStrToObject(this.where);
        var update = this.parseStrToObject(this.updatedata);
        var model = this.selectedTable.trim();
        if (this.selectedId > 0) {
            where = {id: this.selectedId};
        }
        var sendto = {model, where, update}
        console.log('sendto: ', sendto);
        this.$store.dispatch('wsEmitADMINCTL', sendto);
    }
  },
}
</script>



<style lang="scss" scoped>
.global-content {
    height: 360px
}
.global-data .selected {
    color: red;
}
</style>