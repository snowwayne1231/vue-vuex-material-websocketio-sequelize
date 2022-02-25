<template>
  <div class="room">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>AdminQuery</span>
          </div>
          <div class="md-subhead">
            <span>...</span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        <div class='global-content'>
            <div>
                <button @click="onClickRefreshGlobal">Refresh Global</button>
            </div>
            <div>{{user}}</div>
            <div v-for="(val, k) in global" :key="k" @click="onClickGlobalData(val)" class="home-datas">
                <p><span class="content-key">{{k}} </span><span>({{val.length}})</span></p>
            </div>
        </div>
        <div class="global-data">
          <li v-for="(data, idx) in showdata" :key="data.id"><span>[{{idx}}] {{data}}</span></li>
        </div>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import enums from '@/enum';

export default {
  name: 'AdminQuery',
  data() {
    return {
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
    onClickGlobalData(data) {
        console.log(data);
        this.showdata = data;
    },
    onClickRefreshGlobal() {
        this.$store.dispatch('wsEmitAuthorize', 'refreshByAdmin')
    }
  },
}
</script>



<style lang="scss" scoped>

</style>