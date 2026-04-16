import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { LoginSchema, type LoginInput, type User } from '@awdms/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setSubmitError(null);
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(data.user.role === 'admin' ? '/admin' : '/teacher', {
        replace: true,
      });
    } catch {
      setSubmitError(t('auth.invalid_credentials'));
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('auth.login')}</CardTitle>
        </CardHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium text-zinc-700"
            >
              {t('auth.email')}
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-medium text-zinc-700"
            >
              {t('auth.password')}
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {submitError ? (
            <p className="text-xs text-red-600" role="alert">
              {submitError}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{t('auth.submit')}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
