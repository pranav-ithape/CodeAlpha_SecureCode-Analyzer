import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFound: React.FC = () => {
  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <SEO title="Page Not Found | SecureCode Auditor" robots="noindex,nofollow" />
      <div className="w-16 h-16 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-primary">error</span>
      </div>
      <h1 className="text-4xl font-bold font-headline-lg mb-4">404 - Page Not Found</h1>
      <p className="text-on-surface-variant max-w-md mx-auto mb-8 text-lg font-body-md">
        The page you are looking for doesn't exist or has been moved. Check the URL or return to the platform dashboard.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-fixed-dim hover:shadow-lg transition-all"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
