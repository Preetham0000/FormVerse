import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FormSchema, FormField, ValidationRule, ValidationRuleType, FieldType } from '../types';
import { getFormById, getFormForPreview } from '../services/formService';

const validateField = (value: any, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (rule.type === ValidationRuleType.NOT_EMPTY && (!value || value.toString().trim() === '')) {
      return 'This field is required.';
    }
    if (value) {
      if (rule.type === ValidationRuleType.MIN_LENGTH && value.toString().length < (rule.value as number)) {
        return `Must be at least ${rule.value} characters.`;
      }
      if (rule.type === ValidationRuleType.MAX_LENGTH && value.toString().length > (rule.value as number)) {
        return `Must be no more than ${rule.value} characters.`;
      }
      if (rule.type === ValidationRuleType.IS_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString())) {
        return 'Please enter a valid email address.';
      }
      if (rule.type === ValidationRuleType.CUSTOM_PASSWORD && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value.toString())) {
        return 'Password must be at least 8 characters and include a number.';
      }
    }
  }
  return null;
};

const evaluateDerivedField = (field: FormField, formData: Record<string, any>): any => {
    if (!field.isDerived || !field.derivedConfig) return formData[field.id];
    const { parentFieldIds, formula } = field.derivedConfig;

    if (formula === 'AGE_FROM_DOB' && parentFieldIds.length === 1) {
        const dob = formData[parentFieldIds[0]];
        if (!dob || typeof dob !== 'string') return '';
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age >= 0 ? age : '';
        } catch { return ''; }
    }

    try {
        let evalFormula = formula;
        for (const pid of parentFieldIds) {
            const parentValue = parseFloat(formData[pid]);
            if(isNaN(parentValue)) return '';
            evalFormula = evalFormula.replace(new RegExp(`\\{${pid}\\}`, 'g'), String(parentValue));
        }
        
        if (/^[0-9+\-*/().\s]+$/.test(evalFormula)) {
            // eslint-disable-next-line no-new-func
            return new Function(`return ${evalFormula}`)();
        }
    } catch (e) {
        console.error("Derived field evaluation error:", e);
        return 'Error';
    }
    
    return formData[field.id];
};


const PreviewFormPage: React.FC = () => {
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { formId } = useParams<{ formId: string }>();

  useEffect(() => {
    let schema;
    if (formId === 'current') {
      schema = getFormForPreview();
    } else {
      schema = getFormById(formId!);
    }
    setFormSchema(schema);

    if (schema) {
      const initialData: Record<string, any> = {};
      schema.fields.forEach(field => {
        initialData[field.id] = field.defaultValue || '';
        if(field.type === FieldType.CHECKBOX) {
            initialData[field.id] = field.defaultValue === 'true';
        }
      });
      setFormData(initialData);
    }
  }, [formId]);

  const updateDerivedFields = useCallback((currentData: Record<string, any>) => {
    if (!formSchema) return currentData;
    let newData = { ...currentData };
    let changed = false;
    formSchema.fields.forEach(field => {
        if (field.isDerived) {
            const newValue = evaluateDerivedField(field, newData);
            if (newData[field.id] !== newValue) {
                newData[field.id] = newValue;
                changed = true;
            }
        }
    });
    if (changed) setFormData(newData);
    return newData;
  }, [formSchema]);

  useEffect(() => {
    updateDerivedFields(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, updateDerivedFields]);


  const handleChange = (id: string, value: any) => {
    const newFormData = { ...formData, [id]: value };
    setFormData(newFormData);

    const field = formSchema?.fields.find(f => f.id === id);
    if (field) {
      const error = validateField(value, [...(field.required ? [{type: ValidationRuleType.NOT_EMPTY}] : []), ...field.validationRules]);
      setErrors(prev => ({ ...prev, [id]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    const newErrors: Record<string, string | null> = {};
    if (!formSchema) return;

    for (const field of formSchema.fields) {
      const error = validateField(formData[field.id], [...(field.required ? [{type: ValidationRuleType.NOT_EMPTY}] : []), ...field.validationRules]);
      if (error) {
        isValid = false;
        newErrors[field.id] = error;
      }
    }
    setErrors(newErrors);

    if (isValid) {
      alert('Form Submitted Successfully!\n\n' + JSON.stringify(formData, null, 2));
    } else {
      alert('Please fix the errors before submitting.');
    }
  };
  
  const renderField = (field: FormField) => {
    const error = errors[field.id];
    const baseClasses = "block w-full text-base bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-colors duration-300";
    const borderClasses = error 
      ? "border-2 border-red-500" 
      : "border border-slate-300 dark:border-slate-600 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500";
    const disabledClasses = "disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed";

    const commonInputProps = {
        id: field.id,
        disabled: field.isDerived,
        className: `peer ${baseClasses} ${borderClasses} ${disabledClasses} px-4 appearance-none focus:outline-none focus:ring-0 bg-transparent`
    };

    const floatingLabel = (
        <label htmlFor={field.id} className="absolute text-base text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-4 peer-focus:text-primary-600 dark:peer-focus:text-primary-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
    );

    switch (field.type) {
        case FieldType.TEXT:
        case FieldType.EMAIL:
        case FieldType.PASSWORD:
        case FieldType.NUMBER:
        case FieldType.DATE:
            return (
                <div className="relative">
                    <input
                        type={field.type === FieldType.EMAIL ? 'email' : field.type === FieldType.PASSWORD ? 'password' : field.type === FieldType.NUMBER ? 'number' : field.type === FieldType.DATE ? 'date' : 'text'}
                        {...commonInputProps}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder=" "
                        className={`${commonInputProps.className} h-14 pt-4 ${field.type === FieldType.DATE ? 'pr-2' : ''}`}
                    />
                    {floatingLabel}
                </div>
            );
        case FieldType.TEXTAREA:
            return (
                <div className="relative">
                    <textarea
                        {...commonInputProps}
                        rows={4}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder=" "
                        className={`${commonInputProps.className} pt-8`}
                    />
                    {floatingLabel}
                </div>
            );
        case FieldType.SELECT:
            return (
                <div className="relative">
                     <select
                        {...commonInputProps}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={`${commonInputProps.className} h-14`}
                    >
                        <option value=""></option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {floatingLabel}
                </div>
            );
        case FieldType.RADIO:
            return (
                <fieldset className={`${baseClasses} ${borderClasses} p-4`}>
                    <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{field.label}{field.required && <span className="text-red-500">*</span>}</legend>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {field.options?.map(opt => (
                            <div key={opt} className="flex items-center">
                                <input type="radio" id={`${field.id}-${opt}`} name={field.id} value={opt} checked={formData[field.id] === opt} onChange={e => handleChange(field.id, e.target.value)} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                                <label htmlFor={`${field.id}-${opt}`} className="ml-2 block text-sm text-slate-800 dark:text-slate-200">{opt}</label>
                            </div>
                        ))}
                    </div>
                </fieldset>
            );
        case FieldType.CHECKBOX:
            return (
                <div className="flex items-center pt-2">
                    <input type="checkbox" id={field.id} checked={!!formData[field.id]} onChange={e => handleChange(field.id, e.target.checked)} className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 shadow-sm" />
                    <label htmlFor={field.id} className="ml-3 text-base text-slate-800 dark:text-slate-200">{field.label}{field.required && <span className="text-red-500">*</span>}</label>
                </div>
            );
        default:
            return null;
    }
  };

  if (!formSchema) {
    return <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">Form not found.</div>;
  }

  return (
    <div className="p-6 md:p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">{formSchema.name}</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">This is a preview of your form. Fill it out and click submit.</p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-8">
          {formSchema.fields.map(field => (
            <div key={field.id}>
              {renderField(field)}
              {errors[field.id] && <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors[field.id]}</p>}
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button type="submit" className="w-full px-6 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-primary-500">
            Submit Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreviewFormPage;