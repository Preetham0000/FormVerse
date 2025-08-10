import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormBuilder } from '../context/FormBuilderContext';
import { FormField, FieldType, ValidationRule, ValidationRuleType, FormSchema } from '../types';
import { AVAILABLE_FIELD_TYPES, AVAILABLE_VALIDATION_RULES } from '../constants';
import { saveForm, getFormById, saveFormForPreview } from '../services/formService';
import Modal from '../components/Modal';
import { AddIcon, DragHandleIcon, TrashIcon, EyeIcon } from '../components/icons';

const FieldConfigurationPanel: React.FC<{ field: FormField, onUpdate: (field: FormField) => void, allFields: FormField[] }> = ({ field, onUpdate, allFields }) => {
    const [optionsStr, setOptionsStr] = useState(field.options?.join(', ') || '');

    useEffect(() => {
        setOptionsStr(field.options?.join(', ') || '');
    }, [field.options]);

    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOptionsStr(e.target.value);
        onUpdate({ ...field, options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean) });
    };

    const handleValidationChange = (ruleType: ValidationRuleType, e: React.ChangeEvent<HTMLInputElement>) => {
        let rules = [...field.validationRules];
        const existingRuleIndex = rules.findIndex(r => r.type === ruleType);

        if (e.target.checked) {
            if (existingRuleIndex === -1) {
                const newRule: ValidationRule = { type: ruleType };
                if(ruleType === ValidationRuleType.MIN_LENGTH) newRule.value = 8;
                if(ruleType === ValidationRuleType.MAX_LENGTH) newRule.value = 100;
                rules.push(newRule);
            }
        } else {
            rules = rules.filter(r => r.type !== ruleType);
        }
        onUpdate({ ...field, validationRules: rules });
    };
    
    const handleValidationValueChange = (ruleType: ValidationRuleType, value: string | number) => {
        const rules = field.validationRules.map(r => r.type === ruleType ? { ...r, value } : r);
        onUpdate({ ...field, validationRules: rules });
    };

    const handleDerivedConfigChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const isChecked = (e.target as HTMLInputElement).checked;
            onUpdate({ ...field, isDerived: isChecked, derivedConfig: isChecked ? { parentFieldIds: [], formula: '' } : undefined });
            return;
        }

        const newConfig = { ...field.derivedConfig! };
        if (name === 'parentFieldIds') {
            newConfig.parentFieldIds = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
        } else {
            newConfig.formula = value;
        }
        onUpdate({ ...field, derivedConfig: newConfig });
    }

    const otherFields = allFields.filter(f => f.id !== field.id && (f.type === FieldType.DATE || f.type === FieldType.NUMBER));

    const renderInput = (label: string, id: string, type: string, value: any, onChange: (e: any) => void, props: any = {}) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <input id={id} type={type} value={value} onChange={onChange} {...props} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div>
    );
    
    return (
        <div className="p-6 h-full">
            <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Configure Field</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Editing <span className="font-semibold text-primary-500">{field.type}</span> field</p>
            
            <div className="space-y-6">
                {renderInput('Label', `label-${field.id}`, 'text', field.label, e => onUpdate({ ...field, label: e.target.value }))}
                {renderInput('Default Value', `defaultValue-${field.id}`, field.type === FieldType.NUMBER ? 'number' : 'text', field.defaultValue || '', e => onUpdate({ ...field, defaultValue: e.target.value }))}
                
                <div className="flex items-center">
                    <input id={`required-${field.id}`} type="checkbox" checked={field.required} onChange={e => onUpdate({ ...field, required: e.target.checked })} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                    <label htmlFor={`required-${field.id}`} className="ml-3 block text-sm font-medium text-slate-900 dark:text-slate-200">Required Field</label>
                </div>

                {(field.type === FieldType.SELECT || field.type === FieldType.RADIO) && renderInput('Options (comma-separated)', `options-${field.id}`, 'text', optionsStr, handleOptionChange)}

                <div>
                    <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-3">Validation Rules</h4>
                    <div className="space-y-4">
                    {AVAILABLE_VALIDATION_RULES.map(ruleType => (
                        <div key={ruleType}>
                            <div className="flex items-center">
                                <input id={`${ruleType}-${field.id}`} type="checkbox" checked={field.validationRules.some(r => r.type === ruleType)} onChange={e => handleValidationChange(ruleType, e)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                                <label htmlFor={`${ruleType}-${field.id}`} className="ml-3 block text-sm font-medium text-slate-900 dark:text-slate-200">{ruleType}</label>
                            </div>
                            {(ruleType === ValidationRuleType.MIN_LENGTH || ruleType === ValidationRuleType.MAX_LENGTH) && field.validationRules.some(r => r.type === ruleType) && (
                                <input type="number" placeholder="Value" onChange={e => handleValidationValueChange(ruleType, parseInt(e.target.value, 10))} value={field.validationRules.find(r => r.type === ruleType)?.value || ''} className="mt-2 ml-7 block w-1/3 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm" />
                            )}
                        </div>
                    ))}
                    </div>
                </div>
                
                {(field.type === FieldType.NUMBER || field.type === FieldType.TEXT) && (
                    <div>
                         <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-3">Derived Field</h4>
                         <div className="flex items-center">
                            <input id={`isDerived-${field.id}`} type="checkbox" name="isDerived" checked={field.isDerived} onChange={handleDerivedConfigChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                            <label htmlFor={`isDerived-${field.id}`} className="ml-3 block text-sm font-medium text-slate-900 dark:text-slate-200">Compute value from other fields</label>
                        </div>
                        {field.isDerived && (
                            <div className="mt-3 ml-7 space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Parent Fields</label>
                                    <select multiple name="parentFieldIds" value={field.derivedConfig?.parentFieldIds} onChange={handleDerivedConfigChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md">
                                        {otherFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Formula</label>
                                    <input type="text" name="formula" value={field.derivedConfig?.formula} placeholder="e.g., AGE_FROM_DOB" onChange={handleDerivedConfigChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md" />
                                    <p className="text-xs text-slate-500 mt-1.5">Use 'AGE_FROM_DOB' for age calculation. For numbers, use field IDs in curly braces, e.g., {'`{field_id_1} * {field_id_2}`'}.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
};


const CreateFormPage: React.FC = () => {
    const { form, dispatch } = useFormBuilder();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [formName, setFormName] = useState(form.name);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [isFabMenuOpen, setFabMenuOpen] = useState(false);
    const fabRef = useRef<HTMLDivElement>(null);

    const selectedField = form.fields.find(f => f.id === selectedFieldId);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const formIdToEdit = params.get('edit');
        if (formIdToEdit) {
            const formToEdit = getFormById(formIdToEdit);
            if (formToEdit) {
                dispatch({ type: 'LOAD_FORM', payload: formToEdit });
                setFormName(formToEdit.name);
                setSelectedFieldId(formToEdit.fields.length > 0 ? formToEdit.fields[0].id : null);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, dispatch]);

    useEffect(() => { setFormName(form.name) }, [form.name]);

    useEffect(() => {
        if (selectedFieldId && !form.fields.find(f => f.id === selectedFieldId)) {
            setSelectedFieldId(form.fields.length > 0 ? form.fields[0].id : null);
        }
    }, [form.fields, selectedFieldId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setFabMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [fabRef]);

    const addField = (fieldType: FieldType) => {
        dispatch({ type: 'ADD_FIELD', payload: { fieldType } });
        setFabMenuOpen(false);
    }

    const handleSaveForm = () => {
        const finalForm: FormSchema = { ...form, name: formName || 'Untitled Form' };
        saveForm(finalForm);
        setSaveModalOpen(false);
        navigate('/myforms');
    };

    const handlePreview = () => {
        const finalForm: FormSchema = { ...form, name: formName || 'Untitled Form' };
        saveFormForPreview(finalForm);
        window.open(`#/preview/current`, '_blank');
    }

    const onDragStart = (index: number) => setDraggedItemIndex(index);
    const onDragEnd = () => setDraggedItemIndex(null);
    const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;
        dispatch({ type: 'REORDER_FIELDS', payload: { startIndex: draggedItemIndex, endIndex: index } });
        setDraggedItemIndex(index);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-110px)]">
            {/* Page Header */}
            <div className="flex-shrink-0 flex justify-between items-center py-3 px-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Untitled Form" className="text-xl font-bold bg-transparent focus:outline-none focus:ring-0 border-none p-0 text-slate-800 dark:text-white"/>
                <div className="flex items-center space-x-3">
                    <button onClick={handlePreview} className="px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-300 bg-primary-100 dark:bg-primary-500/20 rounded-full hover:bg-primary-200 dark:hover:bg-primary-500/30 transition-colors">Preview</button>
                    <button onClick={() => setSaveModalOpen(true)} className="px-5 py-2 text-sm font-semibold bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-sm">Save Form</button>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 overflow-hidden">
                {/* Left Panel: Form Canvas */}
                <div className="lg:col-span-3 bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl overflow-y-auto">
                    {form.fields.length > 0 ? (
                        <div className="space-y-3">
                            {form.fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    draggable
                                    onDragStart={() => onDragStart(index)}
                                    onDragOver={(e) => onDragOver(e, index)}
                                    onDragEnd={onDragEnd}
                                    onClick={() => setSelectedFieldId(field.id)}
                                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedFieldId === field.id ? 'bg-white dark:bg-slate-700 border-primary-500 shadow-md' : 'bg-white/80 dark:bg-slate-800/80 border-transparent hover:bg-white dark:hover:bg-slate-700/80 hover:shadow-sm'}`}
                                >
                                    <span className="text-slate-400 cursor-grab"><DragHandleIcon /></span>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{field.label}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{field.type} {field.required && <span className="text-red-500">*</span>}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_FIELD', payload: { id: field.id } }) }} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg h-full flex flex-col justify-center items-center">
                            <h2 className="text-xl font-semibold text-slate-500">Form is Empty</h2>
                            <p className="text-slate-400 mt-2">Click the '+' button to add a field.</p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Config */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-y-auto">
                    {selectedField ? (
                        <FieldConfigurationPanel
                            field={selectedField}
                            onUpdate={(updatedField) => dispatch({ type: 'UPDATE_FIELD', payload: updatedField })}
                            allFields={form.fields}
                        />
                    ) : (
                        <div className="text-center p-10 h-full flex flex-col justify-center items-center">
                            <h2 className="text-xl font-semibold text-slate-500">Select a Field</h2>
                            <p className="text-slate-400 mt-2">Click on a field on the left to edit its properties.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FAB */}
            <div ref={fabRef} className="fixed bottom-8 right-8">
                {isFabMenuOpen && (
                    <div className="absolute bottom-16 right-0 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-2xl border dark:border-slate-600 py-2 mb-2 animate-fade-in-up">
                        {AVAILABLE_FIELD_TYPES.map(type => (
                            <button key={type} onClick={() => addField(type)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">{type}</button>
                        ))}
                    </div>
                )}
                <button onClick={() => setFabMenuOpen(!isFabMenuOpen)} className="w-16 h-16 bg-primary-500 text-white rounded-2xl shadow-lg hover:bg-primary-600 flex items-center justify-center transform hover:scale-105 transition-all">
                    <AddIcon className="w-8 h-8"/>
                </button>
            </div>

            <Modal isOpen={isSaveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save Form">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="formName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Form Name</label>
                        <input
                            type="text" id="formName" value={formName} onChange={(e) => setFormName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                        <button onClick={handleSaveForm} className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CreateFormPage;