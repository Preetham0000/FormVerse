export enum FieldType {
  TEXT = 'Text',
  EMAIL = 'Email',
  PASSWORD = 'Password',
  NUMBER = 'Number',
  TEXTAREA = 'Textarea',
  SELECT = 'Select',
  RADIO = 'Radio',
  CHECKBOX = 'Checkbox',
  DATE = 'Date',
}

export enum ValidationRuleType {
  NOT_EMPTY = 'Not Empty',
  MIN_LENGTH = 'Minimum Length',
  MAX_LENGTH = 'Maximum Length',
  IS_EMAIL = 'Email Format',
  CUSTOM_PASSWORD = 'Password Strength',
}

export interface ValidationRule {
  type: ValidationRuleType;
  value?: string | number;
}

export interface DerivedFieldConfig {
  parentFieldIds: string[];
  formula: string; // e.g., 'AGE_FROM_DOB' or a mathematical expression
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: string[]; // For Select, Radio
  validationRules: ValidationRule[];
  isDerived: boolean;
  derivedConfig?: DerivedFieldConfig;
}

export interface FormSchema {
  id: string;
  name: string;
  createdAt: string;
  fields: FormField[];
}