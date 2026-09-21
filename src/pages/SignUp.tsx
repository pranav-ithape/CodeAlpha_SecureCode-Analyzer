import React from 'react';
import { Link } from 'react-router-dom';

const SignUp: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-surface-container-low border border-outline-variant rounded-xl shadow-lg text-center">
        <h2 className="text-headline-lg font-bold text-on-surface mb-2">Create Account</h2>
        <p className="text-on-surface-variant mb-6">Sign up to SecureCode Analyzer to start scanning.</p>
        
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="text-left">
            <label className="block text-body-sm font-medium text-on-surface mb-1">Email</label>
            <input className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:border-primary focus:ring-1 outline-none" type="email" placeholder="name@company.com" />
          </div>
          <div className="text-left">
            <label className="block text-body-sm font-medium text-on-surface mb-1">Password</label>
            <input className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface focus:border-primary focus:ring-1 outline-none" type="password" placeholder="••••••••" />
          </div>
          <button className="w-full h-10 rounded-lg bg-primary text-on-primary font-semibold hover:bg-opacity-90">Sign Up</button>
        </form>
        
        <p className="mt-6 text-on-surface-variant">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
