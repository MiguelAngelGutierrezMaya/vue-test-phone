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
<script>
import { SpecialCountries } from '@/utils/enum/SpecialCountries';
import {
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'libphonenumber-js';
import countries from '@/utils/countries';
import timezoneWithCountry from '@/utils/timezoneWithCountry';
import '@/assets/css/countries.scss';

export default {
  props: {
    value: {
      //   type: [String, Object], // No usar propiedades de más de un tipo
      type: Object,
    },
    placeholder: {
      type: String,
    },
    type: {
      type: String,
      default: 'text',
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    seamless: {
      type: Boolean,
      default: false,
    },
    invert: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isExtra: {
      type: Boolean,
      default: false,
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      countries,
      search: '',
      phoneNumber: {
        code: '',
        number: '',
        phone: '',
        countryName: '',
        valid: false,
      },
      countryPicker: false,
      rerender: 0,
      focused: false,
      inputText: '',
      parsed: false,
    };
  },
  computed: {
    countriesComputed() {
      return countries.filter((c) =>
        c.country.toLowerCase().includes(this.search.toLowerCase()),
      );
    },
    valid() {
      return isValidPhoneNumber(
        '+' + this.phoneNumber.number + this.phoneNumber.phone,
      );
    },
  },
  mounted() {
    if (this.autofocus) (this.$refs.phoneInput)?.focus();
    this.setDefaultCountry();
    setTimeout(() => {
      if (
        this.value &&
        Object.keys(this.value).length > 0 &&
        this.value?.phone
      ) {
        this.phoneNumber = this.value;
      } else if (this.value && this.value.length > 4) {
        this.setPhone();
      }
    }, 300);
  },
  methods: {
    setDefaultCountry() {
      const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (currentTimezone) {
        for (const [key, value] of Object.entries(timezoneWithCountry)) {
          let zone = '';
          if (value.zones.length > 0)
            zone = value.zones.filter((zone) => zone === currentTimezone)[0];
          if (zone) {
            const countryCode = key.toLowerCase();
            const countryInfo = countries.filter(
              (c) => c.code.toLowerCase() === countryCode,
            )[0];
            if (countryInfo) {
              this.phoneNumber.code = countryInfo.code;
              this.phoneNumber.number = countryInfo.number;
              this.phoneNumber.countryName = countryInfo.country;
              return;
            }
          }
        }
        this.phoneNumber.valid = this.valid;
      } else {
        this.phoneNumber = {
          code: 'us',
          number: '1',
          phone: '',
          countryName: 'United States',
          valid: true,
        };
      }
    },
    select(country) {
      this.phoneNumber.code = country.code;
      this.phoneNumber.number = country.number;
      this.phoneNumber.countryName = country.country;
      this.countryPicker = false;
      this.save();
      this.input();
    },
    input(event) {
      if (!this.phoneNumber.phone) {
        this.inputText = '';
        this.parsed = false;
      }
      this.countryPicker = false;
      this.inputText = this.inputText.concat(event?.data?.toString());

      if (
        this.inputText.length > 8 &&
        !this.parsed &&
        this.inputText.includes('+')
      ) {
        this.parse(this.inputText);
      }
      this.phoneNumber.valid = this.valid;
      this.$emit('valid', this.valid);
      this.$emit('input', this.phoneNumber);
    },
    save() {
      this.validateSpecial();
      this.phoneNumber.valid = this.valid;
      this.$emit('save', this.phoneNumber);
    },
    setPhone() {
      //   if (this.value && this.value !== '+' && this.value.phone) { // No usar propiedades de más de un tipo
      if (this.value && this.value.phone) {
        if (this.value.phone.includes('+')) this.parse(this.value.phone);
        else {
          const countryName =
            countries.filter(
              (c) => c.code.toLowerCase() === this.value?.code?.toLowerCase(),
            )[0]?.country || '';
          this.phoneNumber = {
            code: this.value.code,
            number: this.value.number,
            phone: this.value.phone,
            countryName: countryName,
            valid: true,
          };
        }
        this.phoneNumber.valid = this.valid;
      }
      //   else if (this.value && this.value !== '+') {
      //     const value = this.value.replaceAll(' ', '');
      //     this.parse(value);
      //     setTimeout(() => {
      //       this.$emit('input', this.phoneNumber);
      //     }, 500);
      //   }
    },
    parse(value) {
      let phone;
      if (value.includes('+'))
        phone = parsePhoneNumber(value) ? parsePhoneNumber(value) : undefined;
      else {
        phone = parsePhoneNumber('+' + this.phoneNumber.number + value);
      }
      if (phone) {
        const countryName =
          countries.filter(
            (c) => c.code.toLowerCase() === phone?.country?.toLowerCase(),
          )[0]?.country || '';
        const firstCharacters = phone?.nationalNumber.slice(
          0,
          phone?.countryCallingCode.length,
        );
        if (firstCharacters === phone?.countryCallingCode)
          phone.nationalNumber = phone?.nationalNumber.slice(
            phone?.countryCallingCode?.length,
          );
        this.phoneNumber = {
          code:
            phone?.country !== undefined ? phone?.country?.toLowerCase() : 'us',
          number: phone?.countryCallingCode,
          phone: phone?.nationalNumber,
          countryName: countryName,
          valid: true,
        };
        this.parsed = true;
      }
      this.rerender++;
      setTimeout(() => {
        (this.$refs.phoneInput).focus();
      }, 300);
    },
    paste(e) {
      e.preventDefault();
      const phone = e.clipboardData
        ?.getData('text')
        .replaceAll(' ', '')
        .replaceAll('-', '')
        .replaceAll('(', '')
        .replaceAll(')', '');
      this.parse(phone || '');
      this.input();
    },
    validateSpecial() {
      const specialCountry = Object.values(SpecialCountries);
      const formattedNumber =
        '+' + this.phoneNumber.number + this.phoneNumber.phone;
      if (
        this.phoneNumber.countryName &&
        specialCountry.includes(this.phoneNumber.countryName.toLowerCase()) &&
        formattedNumber.length === 10
      ) {
        if (
          this.phoneNumber.number === '54' ||
          this.phoneNumber.number === '52'
        ) {
          if (
            this.phoneNumber.number === '54' &&
            formattedNumber.substr(0, 1) !== '9'
          )
            this.phoneNumber.phone = '9' + this.phoneNumber.phone;
          if (
            this.phoneNumber.number === '52' &&
            formattedNumber.substr(0, 1) !== '1'
          )
            this.phoneNumber.phone = '1' + this.phoneNumber.phone;
        }
      }
    },
    close() {
      this.countryPicker = false;
    },
  },
  watch: {
    value() {
      if (this.value) this.setPhone();
    },
  },
};
</script>
<style scoped lang="scss">
@import './App.scss';
</style>
