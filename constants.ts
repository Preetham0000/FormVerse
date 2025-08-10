import { FieldType, ValidationRuleType } from './types';

export const AVAILABLE_FIELD_TYPES: FieldType[] = [
  FieldType.TEXT,
  FieldType.EMAIL,
  FieldType.PASSWORD,
  FieldType.NUMBER,
  FieldType.TEXTAREA,
  FieldType.SELECT,
  FieldType.RADIO,
  FieldType.CHECKBOX,
  FieldType.DATE,
];

export const AVAILABLE_VALIDATION_RULES: ValidationRuleType[] = [
  ValidationRuleType.NOT_EMPTY,
  ValidationRuleType.MIN_LENGTH,
  ValidationRuleType.MAX_LENGTH,
  ValidationRuleType.IS_EMAIL,
  ValidationRuleType.CUSTOM_PASSWORD,
];

export const FORM_PREVIEW_STORAGE_KEY = 'current_form_preview';
export const ALL_FORMS_STORAGE_KEY = 'all_forms';