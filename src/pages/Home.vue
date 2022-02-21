<template>
  <div class="home">
    <md-card>
      <md-card-header>
        <md-card-header-text>
          <div class="md-title">
            <span>Home</span>
          </div>
          <div class="md-subhead">
            <span>Sub</span>
          </div>
        </md-card-header-text>
      </md-card-header>
      <md-card-content>
        Some Content..
        <Helper title="qqq" />
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Helper from '@/components/panels/Helper';

export default {
  name: 'Home',
  data() {
    return {
      
    }
  },
  components:{
    Helper,
  },
  mounted() {
    
  },
  methods: {
    
  }
}
</script>