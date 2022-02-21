<template>
  <div class="helper" :title="title">
    <md-icon>live_help</md-icon>
  </div>
</template>

<script>
export default {
  name: 'Hepler',
  props: {
    title: String,
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
.helper {
  position: absolute;
  cursor: help;
  width: 24px;
  height: 24px;
  margin: -12px;
}
</style>