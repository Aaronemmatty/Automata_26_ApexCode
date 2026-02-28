import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, UserCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { register, login } from '../api/auth';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const { strengthText, strengthColor } = useMemo(() => {
    switch (strength) {
      case 0: return { strengthText: '', strengthColor: 'bg-slate-700' };
      case 1: return { strengthText: 'Weak', strengthColor: 'bg-red-400' };
      case 2: return { strengthText: 'Moderate', strengthColor: 'bg-yellow-400' };
      case 3: return { strengthText: 'Strong', strengthColor: 'bg-green-400' };
      default: return { strengthText: '', strengthColor: 'bg-slate-700' };
    }
  }, [strength]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim();

      // 1. Register
      await register({
        email: normalizedEmail,
        username: normalizedUsername,
        full_name: fullName,
        password
      });

      // 2. Auto-login
      const { data } = await login({ email: normalizedEmail, password });
      setToken(data.access_token);

      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      {/* Subtle background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-amber-400 rounded-2xl items-center justify-center mb-4">
            <GraduationCap size={28} className="text-slate-900" />
          </div>
          <h1 className="font-display text-3xl text-white mb-1">Join SAIS</h1>
          <p className="text-slate-400 text-sm">Create your student account</p>
        </div>

        {/* Register Card */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
          {/* Full Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Full Name (Optional)</label>
            <div className="relative">
              <UserCircle size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${strength >= 1 ? strengthColor : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded ${strength >= 2 ? strengthColor : 'bg-slate-700'}`} />
                  <div className={`h-1 flex-1 rounded ${strength >= 3 ? strengthColor : 'bg-slate-700'}`} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{strengthText}</p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
