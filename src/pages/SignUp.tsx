import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/apiFetch';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-surface-container-low border border-outline-variant rounded-xl shadow-lg text-center">
        <h2 className="text-headline-lg font-bold text-on-surface mb-2">Create Account</h2>
        <p className="text-on-surface-variant mb-6">Sign up to SecureCode Analyzer to start scanning.</p>
        
        <form className="space-y-4" onSubmit={handleSignUp}>
          {error && <div className="p-2 bg-error bg-opacity-10 text-error rounded text-sm">{error}</div>}
          <div className="text-left">
            <label className="block text-body-sm font-medium text-on-surface mb-1">Name</label>
            <input 
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:border-primary focus:ring-1 outline-none" type="text" placeholder="Jane Doe" required />
          </div>
          <div className="text-left">
            <label className="block text-body-sm font-medium text-on-surface mb-1">Email</label>
            <input 
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:border-primary focus:ring-1 outline-none" type="email" placeholder="name@company.com" required />
          </div>
          <div className="text-left">
            <label className="block text-body-sm font-medium text-on-surface mb-1">Password</label>
            <input 
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:border-primary focus:ring-1 outline-none" type="password" placeholder="••••••••" required />
          </div>
          <button 
            disabled={loading}
            className={`w-full h-10 rounded-lg bg-primary text-on-primary font-semibold hover:bg-opacity-90 flex justify-center items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span> : 'Sign Up'}
          </button>
        </form>
        
        <p className="mt-6 text-on-surface-variant">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
