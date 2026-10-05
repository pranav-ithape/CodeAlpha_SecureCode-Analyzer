import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/apiFetch';
import SEO from '../components/SEO';

const SignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // For premium micro-animations
  const [isHoveringForm, setIsHoveringForm] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Sign up failed');
      } else {
        login(data.token, data.user);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-body-md selection:bg-primary/30 selection:text-primary relative overflow-hidden">
      <SEO 
        title="Request Access | SecureCode Auditor" 
        description="Request access to the SecureCode Auditor platform for enterprise static vulnerability analysis."
        canonical="/signup"
      />
      {/* Floating Theme Toggle */}
      <header className="absolute top-0 right-0 z-50 p-6 flex justify-end items-center pointer-events-none">
        <button 
          aria-label="Toggle Theme" 
          className="pointer-events-auto p-2.5 rounded-full bg-surface/50 backdrop-blur-md border border-outline-variant/50 text-on-surface-variant hover:text-primary hover:bg-surface shadow-sm transition-all duration-300 hover:scale-105"
          onClick={() => document.documentElement.classList.toggle('dark')}
        >
          <span className="material-symbols-outlined text-[20px]">contrast</span>
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen relative">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen hidden lg:block"></div>
        <div className="absolute bottom-[-10%] right-[15%] w-72 h-72 bg-secondary/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen hidden lg:block"></div>

        {/* Left Showcase Panel - Matches Login exactly for seamless UX */}
        <section className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#050A15] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-[#1a233a]">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[150px] pointer-events-none"></div>
          
          <div className="relative z-10 pt-8 pl-8">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-primary/40 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden p-1 relative group">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-xl"></div>
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-lg relative z-10" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white block font-headline-md">SecureCode Auditor</span>
                <span className="text-xs text-primary/80 tracking-[0.2em] uppercase font-semibold">Enterprise SAST Engine v4.2</span>
              </div>
            </div>
            
            <div className="max-w-2xl mt-12">
              <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight font-headline-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-primary/80">
                Join the ultimate security intelligence platform.
              </h1>
              <p className="text-lg text-slate-300 max-w-xl mb-12 leading-relaxed font-body-md font-light">
                Empower your development team with automated static vulnerability analysis, AI-powered remediation, and deterministic zero-day isolation.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <span className="inline-flex items-center gap-2 h-8 px-3 rounded-md font-medium text-sm bg-blue-900/30 border border-blue-500/30 text-blue-200 backdrop-blur-sm shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  AST Syntax Parsing
                </span>
                <span className="inline-flex items-center gap-2 h-8 px-3 rounded-md font-medium text-sm bg-purple-900/30 border border-purple-500/30 text-purple-200 backdrop-blur-sm shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{animationDelay: '0.5s'}}></span>
                  Real-time Taint Flow
                </span>
                <span className="inline-flex items-center gap-2 h-8 px-3 rounded-md font-medium text-sm bg-emerald-900/30 border border-emerald-500/30 text-emerald-200 backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{animationDelay: '1s'}}></span>
                  OWASP & CWE Mapping
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 pb-8 pl-8 border-t border-slate-800/50 mt-12 pt-8 flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-6 font-mono text-xs">
              <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                <span className="material-symbols-outlined text-[14px] text-green-400">enhanced_encryption</span>
                Encrypted Transit (TLS 1.3)
              </span>
              <span className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                <span className="material-symbols-outlined text-[14px] text-blue-400">verified_user</span>
                SOC 2 Compliant
              </span>
            </div>
          </div>
        </section>

        {/* Right Authentication Card */}
        <section className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 bg-surface/80 backdrop-blur-lg">
          <div 
            className="w-full max-w-md bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline-variant/30 p-8 sm:p-10 transition-transform duration-500 hover:shadow-primary/5"
            onMouseEnter={() => setIsHoveringForm(true)}
            onMouseLeave={() => setIsHoveringForm(false)}
          >
            <div className="mb-10 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/30 border border-primary/20 flex items-center justify-center shadow-lg p-1">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-lg" />
                </div>
                <span className="text-xl font-bold text-on-surface">SecureCode Auditor</span>
              </div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">
                Create Account
              </h2>
              <p className="text-on-surface-variant font-medium">
                Set up your SecOps workspace to start scanning.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSignUp}>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="name">
                  Full Name
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </span>
                  <input
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface border-2 border-outline-variant/50 hover:border-outline-variant text-on-surface placeholder:text-outline font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all duration-300 shadow-sm"
                    id="name"
                    name="name"
                    placeholder="Jane Doe"
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="email">
                  Organization Email
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input
                    autoComplete="email"
                    className={`w-full h-12 pl-11 pr-4 rounded-xl bg-surface border-2 ${error && !email ? 'border-error' : 'border-outline-variant/50 hover:border-outline-variant'} text-on-surface placeholder:text-outline font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all duration-300 shadow-sm`}
                    id="email"
                    name="email"
                    placeholder="name@organization.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">key</span>
                  </span>
                  <input
                    autoComplete="new-password"
                    className={`w-full h-12 pl-11 pr-11 rounded-xl bg-surface border-2 ${error && !password ? 'border-error' : 'border-outline-variant/50 hover:border-outline-variant'} text-on-surface placeholder:text-outline font-medium focus:border-primary focus:ring-0 focus:outline-none transition-all duration-300 shadow-sm`}
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-outline hover:text-on-surface focus:outline-none transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-error flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </p>
              )}

              <button
                className={`w-full h-12 mt-6 rounded-xl bg-primary text-on-primary font-bold text-base hover:bg-primary-fixed-dim hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${loading ? 'opacity-80 cursor-not-allowed' : ''} ${isHoveringForm ? 'shadow-md shadow-primary/20' : ''}`}
                type="submit"
                disabled={loading}
              >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
                      <span>Create Account</span>
                    </>
                  )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-outline-variant/40 text-center">
              <p className="text-on-surface-variant font-medium text-sm">
                Already have an account? 
                <Link to="/login" className="text-primary hover:text-primary-fixed-dim hover:underline font-bold ml-1.5 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SignUp;
