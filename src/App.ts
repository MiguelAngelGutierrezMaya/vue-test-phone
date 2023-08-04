import { SpecialCountries } from '@/utils/enum/SpecialCountries';
import {
  PhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'libphonenumber-js';
import countries from '@/utils/countries';
import timezoneWithCountry from '@/utils/timezoneWithCountry';
import '@/assets/css/countries.scss';

import { defineComponent } from 'vue';

export default defineComponent({
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
    countriesComputed(): Record<string, any>[] {
      return countries.filter((c) =>
        c.country.toLowerCase().includes(this.search.toLowerCase()),
      );
    },
    valid(): boolean {
      return isValidPhoneNumber(
        '+' + this.phoneNumber.number + this.phoneNumber.phone,
      );
    },
  },
  mounted(): void {
    if (this.autofocus) (this.$refs.phoneInput as HTMLElement)?.focus();
    this.setDefaultCountry();
    setTimeout(() => {
      if (
        this.value &&
        Object.keys(this.value).length > 0 &&
        this.value?.phone
      ) {
        this.phoneNumber = this.value as any;
      } else if (this.value && this.value.length > 4) {
        this.setPhone();
      }
    }, 300);
  },
  methods: {
    setDefaultCountry(): void {
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
    select(country: any) {
      this.phoneNumber.code = country.code;
      this.phoneNumber.number = country.number;
      this.phoneNumber.countryName = country.country;
      this.countryPicker = false;
      this.save();
      this.input();
    },
    input(event?: any): void {
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
    parse(value: string) {
      let phone: PhoneNumber | undefined;
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
        (this.$refs.phoneInput as HTMLElement).focus();
      }, 300);
    },
    paste(e: ClipboardEvent) {
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
      const specialCountry: string[] = Object.values(SpecialCountries);
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
});
