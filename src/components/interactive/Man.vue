<template>
  <div class="man" @click="$emit('click')" >
    <p class="name">{{name}}</p>
    <span class="active-man">
      <md-icon>accessibility_new</md-icon>
      <md-icon>emoji_people</md-icon>
    </span>
    <span class="be-voted" v-if="voted">
      <md-icon>local_police</md-icon>
    </span>
  </div>
</template>

<script>
export default {
  name: 'Man',
  props: {
    name: String,
    str: String,
    voted: Boolean,
  },
  data() {
    return {
      
    };
  },
  methods: {
    
  }
};
</script>

<style lang="scss" scoped>
.active-man {
  position: relative;
  width: 100%;
  height: 24px;
  display: flex;
  justify-content: center;

  .md-icon {
    position: absolute;
    animation-name: toggledisplay;
    animation-timing-function: linear;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-delay: 0s;

    &:first-child {
      animation-delay: 1s;
    }
  }
}

.man {
  position: relative;
  display: inline-block;
  height: 48px;
  text-align: center;

  .name {
    margin: 0px;
  }

  .be-voted {
    position: absolute;
    top: -8px;
    right: -6px;
    .md-icon {
      color: #ff0000;
      font-size: 32px !important;
      border: 2px outset #ffe845;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      background-color: #fff6b8;
      border-top-right-radius: 0px;
    }
  }
}
</style>