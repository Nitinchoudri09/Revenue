import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const isExpired = searchParams.get('expired') === '1';
  
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm();

  const onSubmit = async (v: any) => {
    setErrorMsg('');
    try {
      const { data } = await api.post('/auth/login', v);
      login(data.access_token);
      nav('/');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || e.message || 'An unknown network error occurred.');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Welcome back</h2>
        <p className="text-[var(--text-secondary)] mt-2 font-medium">
          Access your reconciliation workspace.
        </p>
      </div>

      {isExpired && !errorMsg && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex gap-3 text-sm font-medium">
          <Info className="shrink-0" size={18} />
          <p>Your session has expired. Please sign in again.</p>
        </div>
      )}

      {errorMsg && <ErrorMessage title="Login Failed" message={errorMsg} />}

      <div className="space-y-4">
        <Input
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          error={errors.email?.message as string}
          {...register('email', { required: 'Email is required' })}
        />
        
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message as string}
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type="button"
            className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full h-11" isLoading={isSubmitting}>
        Sign in
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitch}
          className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary-teal)] transition-colors"
        >
          New here? Create an account
        </button>
      </div>
    </form>
  );
}
