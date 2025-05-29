export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  pattern: RegExp;
  minLength: number;
  maxLength: number;
}

export const countryCodes: CountryCode[] = [
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    pattern: /^\+1[2-9]\d{9}$/,
    minLength: 10,
    maxLength: 10
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    pattern: /^\+44[1-9]\d{9}$/,
    minLength: 10,
    maxLength: 10
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    pattern: /^\+91[6-9]\d{9}$/,
    minLength: 10,
    maxLength: 10
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    pattern: /^\+1[2-9]\d{9}$/,
    minLength: 10,
    maxLength: 10
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    pattern: /^\+61[2-9]\d{8}$/,
    minLength: 9,
    maxLength: 9
  }
];

export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) return false;
  return country.pattern.test(phone);
};

export const getPhoneNumberError = (phone: string, countryCode: string): string | null => {
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) return 'Invalid country code';
  
  if (!phone.startsWith(country.dialCode)) {
    return `Phone number must start with ${country.dialCode}`;
  }
  
  const numberLength = phone.length - country.dialCode.length;
  if (numberLength < country.minLength) {
    return `Phone number must be at least ${country.minLength} digits`;
  }
  if (numberLength > country.maxLength) {
    return `Phone number must not exceed ${country.maxLength} digits`;
  }
  
  if (!country.pattern.test(phone)) {
    return `Invalid phone number format for ${country.name}`;
  }
  
  return null;
}; 