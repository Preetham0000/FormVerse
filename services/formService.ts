
import { FormSchema } from '../types';
import { ALL_FORMS_STORAGE_KEY, FORM_PREVIEW_STORAGE_KEY } from '../constants';

export const getAllForms = (): FormSchema[] => {
  try {
    const formsJson = localStorage.getItem(ALL_FORMS_STORAGE_KEY);
    return formsJson ? JSON.parse(formsJson) : [];
  } catch (error) {
    console.error("Failed to parse forms from localStorage", error);
    return [];
  }
};

export const saveForm = (formToSave: FormSchema): void => {
  const forms = getAllForms();
  const existingIndex = forms.findIndex(form => form.id === formToSave.id);

  if (existingIndex > -1) {
    forms[existingIndex] = formToSave;
  } else {
    forms.push(formToSave);
  }

  localStorage.setItem(ALL_FORMS_STORAGE_KEY, JSON.stringify(forms));
};

export const getFormById = (id: string): FormSchema | null => {
  const forms = getAllForms();
  return forms.find(form => form.id === id) || null;
};

export const deleteFormById = (id: string): void => {
  let forms = getAllForms();
  forms = forms.filter(form => form.id !== id);
  localStorage.setItem(ALL_FORMS_STORAGE_KEY, JSON.stringify(forms));
};

export const saveFormForPreview = (form: FormSchema): void => {
    localStorage.setItem(FORM_PREVIEW_STORAGE_KEY, JSON.stringify(form));
};

export const getFormForPreview = (): FormSchema | null => {
    try {
        const formJson = localStorage.getItem(FORM_PREVIEW_STORAGE_KEY);
        return formJson ? JSON.parse(formJson) : null;
    } catch (error) {
        console.error("Failed to parse preview form from localStorage", error);
        return null;
    }
}
