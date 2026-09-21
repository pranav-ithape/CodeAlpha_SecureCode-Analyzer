import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailStatus, setEmailStatus] = useState('LDAP / SSO enabled');
  const [emailError, setEmailError] = useState(false);

  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val.includes('@') && val.includes('.')) {
      setEmailStatus('Organization domain verified');
      setEmailError(false);
    } else if (val.length > 3) {
      setEmailStatus('Checking directory...');
    } else {
      setEmailStatus('LDAP / SSO enabled');
      setEmailError(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setEmailError(true);
      return;
    }
    
    // Auth backend not yet integrated
    navigate('/');
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col font-body-md selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Floating Utility Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-space-lg py-4 flex justify-end items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <button 
            aria-label="Toggle Theme" 
            className="p-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <span className="material-symbols-outlined text-[18px]">contrast</span>
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Showcase Panel */}
        <section className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-surface-container-lowest border-r border-outline-variant p-space-xl flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#adc6ff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 pt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-[24px]">security</span>
              </div>
              <div>
                <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface block">SecureCode Analyzer</span>
                <span className="font-label-code-sm text-label-code-sm text-primary tracking-wider uppercase">Enterprise SAST Engine v4.2</span>
              </div>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface max-w-xl mb-3 leading-snug">
              Mission-critical static vulnerability analysis and automated taint tracing.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-8">
              Continuous AST engine inspection built for high-velocity SecOps pipelines. Zero runtime telemetry overhead with deterministic zero-day isolation.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[4px] font-label-badge text-label-badge bg-[#111827] border border-outline-variant text-on-surface">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                AST Syntax Parsing
              </span>
              <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[4px] font-label-badge text-label-badge bg-[#111827] border border-outline-variant text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Real-time Taint Flow
              </span>
              <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[4px] font-label-badge text-label-badge bg-[#111827] border border-outline-variant text-on-surface">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                OWASP Top 10 & CWE-89
              </span>
              <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[4px] font-label-badge text-label-badge bg-[#111827] border border-outline-variant text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                SARIF 2.1.0 Ready
              </span>
            </div>
          </div>
          
          <div className="relative z-10 pt-4 border-t border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-6 text-on-surface-variant font-label-code-sm text-xs">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                Encrypted Transit
              </span>
            </div>
          </div>
        </section>

        {/* Right Authentication Card */}
        <section className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-12 bg-surface relative z-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">SecureCode Analyzer</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Log in to your SecOps workspace and active rule engines.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="email">
                    Organization Email
                  </label>
                  <span className={`font-label-code-sm text-[11px] ${emailStatus.includes('verified') ? 'text-secondary' : 'text-outline'}`}>
                    {emailStatus}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </span>
                  <input
                    autoComplete="email"
                    className={`w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container border ${emailError ? 'border-error' : 'border-outline-variant'} text-on-surface placeholder:text-outline font-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors`}
                    id="email"
                    name="email"
                    placeholder="name@organization.com"
                    required
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </div>
                {emailError && (
                  <p className="mt-1 font-body-sm text-body-sm text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    Please enter a valid organization email address.
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface" htmlFor="password">
                    Password
                  </label>
                  <a className="font-body-sm text-body-sm text-primary hover:underline transition-colors" href="#">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </span>
                  <input
                    autoComplete="current-password"
                    className="w-full h-10 pl-9 pr-10 rounded-lg bg-surface-container border border-outline-variant text-on-surface placeholder:text-outline font-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline hover:text-on-surface focus:outline-none transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                className="w-full h-10 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold hover:bg-opacity-90 active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                type="submit"
              >
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>Sign In to Workspace</span>
                  </>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Don't have an account? 
                <Link to="/signup" className="text-primary hover:underline font-medium ml-1">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
