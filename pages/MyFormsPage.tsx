import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FormSchema } from '../types';
import { getAllForms, deleteFormById } from '../services/formService';
import { useFormBuilder } from '../context/FormBuilderContext';
import { EditIcon, TrashIcon, EyeIcon, AddIcon } from '../components/icons';

const MyFormsPage: React.FC = () => {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const { dispatch } = useFormBuilder();

  useEffect(() => {
    setForms(getAllForms());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      deleteFormById(id);
      setForms(getAllForms());
    }
  };

  const handleCreateNew = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Forms</h1>
        <Link
          to="/create"
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
        >
          <AddIcon className="w-5 h-5" />
          <span className="font-semibold">Create New Form</span>
        </Link>
      </div>

      {forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate">{form.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Created: {new Date(form.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Fields: {form.fields.length}
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <Link to={`/preview/${form.id}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm">
                  <EyeIcon className="w-5 h-5" />
                  Preview
                </Link>
                <div className="flex items-center space-x-1">
                  <Link to={`/create?edit=${form.id}`} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Edit">
                    <EditIcon className="w-5 h-5"/>
                  </Link>
                  <button onClick={() => handleDelete(form.id)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 rounded-full transition-colors" title="Delete">
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">No forms yet!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-md mx-auto">Ready to build something amazing? Click 'Create New Form' to get started and bring your ideas to life.</p>
        </div>
      )}
    </div>
  );
};

export default MyFormsPage;