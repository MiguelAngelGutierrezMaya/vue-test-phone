<template>
  <div
    class="KBPhone"
    :class="{ 'KBPhone--open': countryPicker }"
    :key="rerender"
  >
    <div
      class="KBPhone__countries newBackground inverted"
      v-if="invert"
      :class="{ 'KBPhone__countries--open': countryPicker }"
    >
      <div class="search userDetails">
        <!-- No usar traducciones en componentes -->
        <!-- <input type="text" v-model="search" :placeholder="$t('search')" />  -->
        <input type="text" v-model="search" :placeholder="'Buscar'" />
      </div>
      <div class="list newBackground">
        <div
          v-for="(country, index) in countriesComputed"
          :key="index"
          class="country"
          @click="select(country)"
        >
          <img class="iti-flag" :class="country.code" />
          <span>(+{{ country.number }}) {{ country.country }}</span>
        </div>
      </div>
    </div>
    <div
      class="KBPhone__container"
      :class="{
        'KBPhone__container--incorrect': !valid,
        'KBPhone__container--outlined': outlined,
        'KBPhone__container--outlined-incorrect': outlined && !valid,
        'KBPhone__container--seamless': seamless,
        'KBPhone__container--seamless-incorrect': seamless && !valid,
        'KBPhone__container--focused': focused,
      }"
    >
      <img
        class="iti-flag"
        :class="`${outlined ? '-ml-4 mr-3' : ''} ${phoneNumber.code}`"
        @click="countryPicker = !countryPicker"
      />
      <span class="cursor-default">(+{{ phoneNumber.number }})</span>
      <input
        @paste="paste($event)"
        type="number"
        ref="phoneInput"
        v-model="phoneNumber.phone"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="input"
        :autofocus="autofocus"
        @keyup.enter="save"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>
    <div
      class="KBPhone__countries newBackground"
      v-if="!invert"
      :class="{ 'KBPhone__countries--open': countryPicker }"
    >
      <div class="search userDetails">
        <!-- No usar traducciones -->
        <!-- <input type="text" v-model="search" :placeholder="$t('search')" /> -->
        <input type="text" v-model="search" :placeholder="'Search'" />
      </div>
      <div class="list newBackground">
        <div
          v-for="(country, index) in countriesComputed"
          :key="index"
          class="country"
          @click="select(country)"
        >
          <img class="iti-flag" :class="country.code" />
          <span>(+{{ country.number }}) {{ country.country }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import App from './App';
export default App;
</script>
<style scoped lang="scss">
@import './App.scss';
</style>
