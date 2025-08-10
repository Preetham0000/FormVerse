
import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { FormField, FormSchema, FieldType } from '../types';

type Action =
  | { type: 'ADD_FIELD'; payload: { fieldType: FieldType } }
  | { type: 'UPDATE_FIELD'; payload: FormField }
  | { type: 'DELETE_FIELD'; payload: { id: string } }
  | { type: 'REORDER_FIELDS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'LOAD_FORM'; payload: FormSchema }
  | { type: 'RESET_FORM' };

const initialFormSchema: FormSchema = {
  id: `form_${Date.now()}`,
  name: 'Untitled Form',
  createdAt: new Date().toISOString(),
  fields: [],
};

const reducer = (state: FormSchema, action: Action): FormSchema => {
  switch (action.type) {
    case 'ADD_FIELD':
      const newField: FormField = {
        id: `field_${Date.now()}`,
        type: action.payload.fieldType,
        label: `New ${action.payload.fieldType} Field`,
        required: false,
        validationRules: [],
        isDerived: false,
        options: action.payload.fieldType === FieldType.SELECT || action.payload.fieldType === FieldType.RADIO ? ['Option 1', 'Option 2'] : undefined,
      };
      return { ...state, fields: [...state.fields, newField] };
    case 'UPDATE_FIELD':
      return {
        ...state,
        fields: state.fields.map(field => field.id === action.payload.id ? action.payload : field),
      };
    case 'DELETE_FIELD':
      return {
        ...state,
        fields: state.fields.filter(field => field.id !== action.payload.id),
      };
    case 'REORDER_FIELDS':
      const { startIndex, endIndex } = action.payload;
      const result = Array.from(state.fields);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { ...state, fields: result };
    case 'LOAD_FORM':
      return action.payload;
    case 'RESET_FORM':
        return {
            id: `form_${Date.now()}`,
            name: 'Untitled Form',
            createdAt: new Date().toISOString(),
            fields: [],
        };
    default:
      return state;
  }
};

const FormBuilderContext = createContext<{
  form: FormSchema;
  dispatch: Dispatch<Action>;
}>({
  form: initialFormSchema,
  dispatch: () => null,
});

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialFormSchema);

  return (
    <FormBuilderContext.Provider value={{ form: state, dispatch }}>
      {children}
    </FormBuilderContext.Provider>
  );
};

export const useFormBuilder = () => useContext(FormBuilderContext);
