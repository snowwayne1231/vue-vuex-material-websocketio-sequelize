<template>
  <div class="assignment" @click="$emit('click')" >
    <div class="assignment-title">
      {{title}}
      <span class="close-btn" @click="clickClose">X</span>
    </div>
    <div class="assignment-ctl">
      <div v-if="selectedPos">
        <table>
          <tr>
            <th width="25%" style="font-size: 1.5em; color: #ffe529;">{{selectedPos.name}}</th>
            <th width="25%">>>></th>
            <th width="25%">
              <span v-if="getHasOccupated(selectedPos.id)" style="color: #ffe529;">{{selectedCandidateName}}</span>
              <select v-else v-model="selectedCandidateId">
                <option v-for="(opt) in getOptionsByPosition()" :key="opt.value" :value="opt.value">{{opt.label}}</option>
              </select>
            </th>
            <th width="25%">
              <button style="font-size: 13px;" v-if="getHasOccupated(selectedPos.id)" @click="onClickDismiss">解任</button>
              <button style="font-size: 13px;" v-else @click="onClickAssignment">任命</button>
            </th>
          </tr>
          <tr>
            <td>增加行動力上限</td>
            <td>{{selectedPos.addActPoint}}</td>
            <td>貢獻值需求</td>
            <td>{{selectedPos.contributionCondi}}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="assignment-left">
      <ul>
        <li v-for="(pos, idx) in positions" :key="idx" @click="onClickPosition(pos)">
          {{pos.name}} 【 {{getCandidateByPositionId(pos.id).name}} 】
        </li>
      </ul>
    </div>
    <div class="assignment-right">
      <ul>
        <li v-for="(cdd, idx) in candidates" :key="idx" :class="{selected: selectedPos && cdd.occupationId == selectedPos.id, targeted: selectedCandidateId == cdd.id}">
          ( {{cdd.contribution}} ) - {{cdd.name}}  {{getPositionById(cdd.occupationId)}}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Assignment',
  props: {
    title: String,
    positions: Object,
    candidates: Array,
    clickClose: Function,
  },
  data() {
    return {
      selectedPos: null,
      selectedCandidateId: 0,
      selectedCandidateName: '',
    };
  },
  mounted() {
    console.log('candidates: ', this.candidates);
  },
  methods: {
    onClickPosition(pos) {
      const candi = this.getCandidateByPositionId(pos.id);
      this.selectedPos = pos;
      this.selectedCandidateId = candi ? candi.id || 0 : 0;
      this.selectedCandidateName = candi.name;
    },
    onClickAssignment() {
      const userId = this.selectedCandidateId;
      const occupationId = this.selectedPos.id;
      this.$store.dispatch('actAppointOccupation', {userId, occupationId});
    },
    onClickDismiss() {
      const userId = this.selectedCandidateId;
      this.$store.dispatch('actDismissOccupation', {userId});
    },
    getPositionById(id) {
      const p = this.positions[id];
      return p ? `<===> ${p.name}` : '';
    },
    getOptionsByPosition() {
      const self = this;
      const ary = self.selectedPos ? self.candidates.filter(c => c.contribution > self.selectedPos.contributionCondi).map(c => {return {value: c.id, label: c.name}}) : [];
      return ary.concat({value: 0, label: '無'});
    },
    getCandidateByPositionId(id) {
      return this.candidates.find(c => c.occupationId == id) || {};
    },
    getHasOccupated(posId) {
      return this.candidates.filter(c => c.occupationId == posId).length > 0;
    }
  }
};
</script>

<style lang="scss" scoped>
.assignment {
  position: fixed;
  width: 60vw;
  height: 80vh;
  top: 10vh;
  left: 20vw;
  box-sizing: border-box;
  border: 2px outset #d7cd36;
  background-color: #222;
  color: #d7cd36;
  display: inline-block;

  ul {
    list-style: none;
    text-align: left;
    padding-left: 6vw;
    li {
      padding: 2px 10px;
    }
  }
  .assignment-title {
    line-height: 40px;
    font-size: 32px;
    width: 100%;
    .close-btn {
      color: #ff1d1d;
      position: absolute;
      right: -10px;
      top: -10px;
      line-height: 25px;
      cursor: pointer;
      background: #222;
      padding: 10px;
      border-radius: 50%;
      border: 2px solid #d7cd36;
      &:hover {
        background: #3f3f30;
      }
    }
  }
  .assignment-left {
    width: 50%;
    float: left;
    li {
      cursor: pointer;
      &:hover {
        background-color: #555;
      }
    }
  }
  .assignment-right {
    width: 50%;
    float: right;
    overflow: auto;
    max-height: calc(100% - 100px);
    .selected {
      color: #ff8585;
    }
    .targeted {
      color: #85ff00;
    }
  }
  .assignment-ctl {
    height: 60px;
    border-bottom: 1px solid #d7cd36;
    table {
      width: 80%;
      margin: 0 auto;
    }
  }
}

</style>