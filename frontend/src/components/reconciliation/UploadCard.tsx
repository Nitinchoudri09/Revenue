import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCloud, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';

export function UploadCard({ kind, onDone }: { kind: 'orders' | 'payments'; onDone: (id: number | undefined) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const f = new FormData();
      f.append('file', file!);
      return (await api.post(`/upload/${kind}`, f)).data;
    },
    onSuccess: async (d) => {
      onDone(d.dataset_id);
      if (d.errors > 0) {
        setSuccessMsg('');
        try {
          const res = await api.get(`/dataset/${d.dataset_id}/errors`);
          setErrors(res.data);
        } catch (e) {}
      } else {
        setErrors([]);
        setSuccessMsg(`Successfully validated ${d.rows} ${kind}.`);
      }
    },
    onError: (e: any) => {
      setErrors([{ row_index: 'System', error_message: e.response?.data?.detail || 'Upload failed' }]);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrors([]);
      setSuccessMsg('');
      onDone(undefined);
    }
  };

  const handleClear = () => {
    setFile(null);
    setErrors([]);
    setSuccessMsg('');
    onDone(undefined);
  };

  return (
    <div className="panel p-6 border-dashed border-2 hover:border-[var(--primary-teal)]/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-teal)]/10 text-[var(--primary-teal)] flex items-center justify-center">
            <UploadCloud size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg capitalize">{kind} Data</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {file ? file.name : `Upload your ${kind}.csv file`}
            </p>
          </div>
        </div>
        {file && !mutation.isPending && !successMsg && (
          <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {!file && (
        <div className="mt-6">
          <label className="btn secondary w-full cursor-pointer justify-center border-dashed">
            <span>Browse files</span>
            <input
              type="file"
              className="hidden"
              accept=".csv,text/csv"
              onChange={handleFileChange}
            />
          </label>
          <p className="text-xs text-slate-400 text-center mt-3">CSV format only. Max 50MB.</p>
        </div>
      )}

      {file && !successMsg && errors.length === 0 && (
        <Button 
          className="w-full mt-6" 
          isLoading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Validate and Process
        </Button>
      )}

      {successMsg && (
        <div className="mt-6 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 flex items-start gap-3">
          <CheckCircle2 className="text-[var(--success-green)] mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-[var(--success-green)]">Validation Passed</p>
            <p className="text-xs text-green-700/80 mt-1">{successMsg}</p>
          </div>
          <button onClick={handleClear} className="ml-auto text-green-700/50 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-6 p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
          <AlertTriangle className="text-[var(--critical-red)] mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--critical-red)]">Validation Failed</p>
            <ul className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {errors.map((err, i) => (
                <li key={i} className="text-xs text-red-700/80">
                  <span className="font-semibold">Row {err.row_index}:</span> {err.error_message}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={handleClear} className="text-red-700/50 hover:text-red-700 p-1 bg-red-100 rounded">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
