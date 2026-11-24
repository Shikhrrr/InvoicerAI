import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { useToast } from '../hooks/useToast';
import { DoodleCrown, DoodleTape, DoodleStar } from '../components/doodle/DoodleAssets';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      toast.success('Account created successfully! Welcome to InvoicerAI.');
      navigate('/app', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Email or username might already be in use.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notebook-grid flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <DoodleStar className="absolute top-10 right-14 w-8 h-8 text-yellow-400 rotate-12 opacity-80" />
      <DoodleStar className="absolute bottom-12 left-16 w-8 h-8 text-red-600 -rotate-12 opacity-80" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="relative w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] -rotate-3 group-hover:rotate-0 transition-transform">
            <DoodleCrown className="absolute -top-3.5 -right-2 w-5 h-4 text-red-600 rotate-12" />
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-marker text-3xl tracking-wide text-slate-900">
            invoicer<span className="text-white bg-red-600 px-1.5 py-0.5 text-lg rounded-sm border-2 border-slate-900 shadow-[1px_1px_0px_#0f172a] ml-1">AI</span>
          </span>
        </Link>
        <h2 className="text-3xl font-heading font-bold tracking-normal text-slate-900">
          Naya Khata Banayein
        </h2>
        <p className="mt-1 text-sm font-sans text-slate-600">
          Digitize your shop billing and bookkeeping in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="relative">
          <DoodleTape color="blue" rotate="rotate-1" className="top-[-10px] left-1/2 -translate-x-1/2 w-32 h-6" />
          <Card className="p-8 relative">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-600 rounded-md text-sm font-sans font-bold text-red-700 shadow-[2px_2px_0px_#dc2626]">
                  {error}
                </div>
              )}

              <Input
                label="Shopkeeper / Store Name"
                type="text"
                required
                placeholder="Sharma General Store"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                prefixIcon={<User className="w-4 h-4 text-slate-500" />}
                helperText="Min 3 characters"
              />

              <Input
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                placeholder="sharmaji@dukaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail className="w-4 h-4 text-slate-500" />}
              />

              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock className="w-4 h-4 text-slate-500" />}
                helperText="Min 8 characters"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-heading font-bold text-lg py-3 shadow-[4px_4px_0px_#0f172a]"
              >
                <span>Register Store — Free</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t-2 border-slate-900 border-dashed text-center">
              <p className="text-sm font-sans text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-heading font-bold text-blue-700 hover:text-red-600 hover:underline decoration-wavy ml-1"
                >
                  Login Here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
