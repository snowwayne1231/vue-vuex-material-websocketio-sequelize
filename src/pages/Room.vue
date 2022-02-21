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
        <Man 
          name="first-man"
          :voted="localVoteBoolean"
          @click="onClickMan"
        />
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
// import { mapState } from 'vuex'
import Man from '@/components/interactive/Man';

export default {
  name: 'Room',
  data() {
    return {
      localVoteBoolean: false,
    }
  },
  components: {
    Man,
  },
  mounted() {
    
  },
  methods: {
    onClickMan() {
      this.localVoteBoolean = !this.localVoteBoolean;
    },
  },
}
</script>