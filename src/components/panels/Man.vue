<template>
  <div class="man" @click="$emit('click')" >
    <span class="name">{{name}}</span>
    <span class="active-man">
      <md-icon>accessibility_new</md-icon>
      <md-icon>emoji_people</md-icon>
    </span>
    <div class="group-ability">
      <i v-if="isS(str)" class="icon-ability icon-str">
      </i><i v-if="isS(dex)" class="icon-ability icon-dex">
      </i><i v-if="isS(con)" class="icon-ability icon-con">
      </i><i v-if="isS(wis)" class="icon-ability icon-wis">
      </i><i v-if="isS(cha)" class="icon-ability icon-cha"></i>
    </div>
    <span class="mvp" v-if="mvp > 0">
      <md-icon>star</md-icon>
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
    dex: String,
    con: String,
    wis: String,
    cha: String,
    mvp: Number,
    voted: Boolean,
  },
  data() {
    return {
      
    };
  },
  methods: {
    isS(_) {
      return _=='S';
    }
  }
};
</script>