import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm();

  const onSubmit = async (v: any) => {
    setErrorMsg('');
    try {
      const { data } = await api.post('/auth/register', v);
      login(data.access_token);
      nav('/');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || e.message || 'An unknown network error occurred.');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">Create your workspace</h2>
        <p className="text-[var(--text-secondary)] mt-2 font-medium">
          Start reconciling your revenue deterministically.
        </p>
      </div>

      {errorMsg && <ErrorMessage title="Registration Failed" message={errorMsg} />}

      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          error={errors.name?.message as string}
          {...register('name', { required: 'Name is required' })}
        />

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
            autoComplete="new-password"
            error={errors.password?.message as string}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Must be at least 8 characters' } })}
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
        Create account
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitch}
          className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary-teal)] transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
}
