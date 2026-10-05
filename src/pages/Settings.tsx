import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const Settings: React.FC = () => {
  const { user, logout, login } = useAuth(); // We might need login to refresh token if we change email/password, but here we just logout on password change or delete
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'policies' | 'integrations' | 'danger'>('account');
  
  // Data states
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [role, setRole] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [policies, setPolicies] = useState({
    requireComplexPassword: false,
    sessionTimeoutMinutes: 60,
    allowReportGeneration: true,
  });

  const [integrations, setIntegrations] = useState<any>(null);
  
  const [deletePassword, setDeletePassword] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setProfileName(data.user.name);
        setProfileEmail(data.user.email);
        setRole(data.user.role);
        if (data.settings && data.settings.policies) {
          setPolicies(data.settings.policies);
        }
      }
      
      const intRes = await apiFetch('/api/settings/integrations');
      if (intRes.ok) {
        const intData = await intRes.json();
        setIntegrations(intData.integrations);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      showMessage('error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Profile updated successfully.');
      } else {
        showMessage('error', data.message || 'Failed to update profile.');
      }
    } catch (err) {
      showMessage('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showMessage('error', 'Current and new passwords are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      showMessage('error', 'New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Password updated successfully. Please log in again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        showMessage('error', data.message || 'Failed to update password.');
      }
    } catch (err) {
      showMessage('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicies = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings/policies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Policies updated successfully.');
      } else {
        showMessage('error', data.message || 'Failed to update policies.');
      }
    } catch (err) {
      showMessage('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMessage('error', 'Please enter your password to confirm.');
      return;
    }
    const confirm = window.confirm("WARNING: This action is irreversible. Are you absolutely sure you want to delete your account?");
    if (!confirm) return;

    setSaving(true);
    try {
      const res = await apiFetch('/api/settings/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        showMessage('error', data.message || 'Failed to delete account.');
      }
    } catch (err) {
      showMessage('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="text-headline-lg font-bold text-on-surface">Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage your account profile and workspace preferences.</p>
      </div>
      
      {message && (
        <div className={`p-4 rounded-lg font-medium border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-error/10 text-error border-error/20'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 border-r border-outline-variant pr-6">
          <ul className="space-y-1">
            <li 
              onClick={() => setActiveTab('account')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors ${activeTab === 'account' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              Account Details
            </li>
            <li 
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors ${activeTab === 'security' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              Account Security
            </li>
            {role === 'ADMIN' && (
              <li 
                onClick={() => setActiveTab('policies')}
                className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors ${activeTab === 'policies' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
              >
                Security Policies
              </li>
            )}
            <li 
              onClick={() => setActiveTab('integrations')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors ${activeTab === 'integrations' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              Integrations
            </li>
            <li 
              onClick={() => setActiveTab('danger')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors mt-6 ${activeTab === 'danger' ? 'bg-error/10 text-error border-l-2 border-error' : 'text-error hover:bg-error/5 hover:text-error'}`}
            >
              Danger Zone
            </li>
          </ul>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Account Details Tab */}
          {activeTab === 'account' && (
            <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
              <h3 className="text-headline-sm font-bold mb-6">Account Details</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-label-code-sm font-medium mb-1">Full Name</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-code-sm font-medium mb-1">Email Address</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-outline cursor-not-allowed opacity-75" 
                    type="email" 
                    value={profileEmail} 
                    disabled 
                    title="Email address cannot be changed currently."
                  />
                </div>
                <div>
                  <label className="block text-label-code-sm font-medium mb-1">Role</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-outline cursor-not-allowed font-mono text-sm opacity-75" 
                    type="text" 
                    value={role} 
                    disabled 
                  />
                </div>
                <div className="pt-4 mt-6">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 h-10 rounded bg-primary text-on-primary font-bold hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
              <h3 className="text-headline-sm font-bold mb-2">Change Password</h3>
              <p className="text-sm text-on-surface-variant mb-6">Ensure your account is using a long, random password to stay secure.</p>
              
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-label-code-sm font-medium mb-1">Current Password</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-code-sm font-medium mb-1">New Password</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-label-code-sm font-medium mb-1">Confirm New Password</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <div className="pt-4 mt-6">
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={saving}
                    className="px-6 h-10 rounded bg-primary text-on-primary font-bold hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>}
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Policies Tab (ADMIN only) */}
          {activeTab === 'policies' && role === 'ADMIN' && (
            <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
              <h3 className="text-headline-sm font-bold mb-2">Security Policies</h3>
              <p className="text-sm text-on-surface-variant mb-6">Configure global workspace security rules and restrictions.</p>
              
              <div className="space-y-6 max-w-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-on-surface text-sm">Require Complex Passwords</h4>
                    <p className="text-xs text-outline mt-1">Enforce minimum length, uppercase, numbers, and symbols.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={policies.requireComplexPassword} onChange={(e) => setPolicies({...policies, requireComplexPassword: e.target.checked})} />
                    <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-on-surface text-sm">Allow Report Generation</h4>
                    <p className="text-xs text-outline mt-1">Let users export PDF and HTML security reports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={policies.allowReportGeneration} onChange={(e) => setPolicies({...policies, allowReportGeneration: e.target.checked})} />
                    <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div>
                  <h4 className="font-semibold text-on-surface text-sm mb-2">Session Timeout (Minutes)</h4>
                  <input 
                    type="number" 
                    className="w-32 h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors"
                    value={policies.sessionTimeoutMinutes}
                    onChange={(e) => setPolicies({...policies, sessionTimeoutMinutes: parseInt(e.target.value) || 60})}
                  />
                  <p className="text-xs text-outline mt-2">Automatically log users out after inactivity.</p>
                </div>
                
                <div className="pt-4 border-t border-outline-variant mt-6">
                  <button 
                    onClick={handleSavePolicies}
                    disabled={saving}
                    className="px-6 h-10 rounded bg-primary text-on-primary font-bold hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>}
                    Save Policies
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
              <h3 className="text-headline-sm font-bold mb-6">Integrations</h3>
              
              <div className="space-y-6">
                <div className="border border-outline-variant rounded-lg p-5 bg-surface">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                        {integrations?.ai?.provider || 'AI Analysis'}
                      </h4>
                      <p className="text-sm text-outline mt-1 max-w-md">Provides automated vulnerability analysis, remediation advice, and confident security assessments.</p>
                    </div>
                    {integrations?.ai?.status === 'Configured' ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">Active</span>
                    ) : (
                      <span className="px-3 py-1 bg-surface-variant text-outline text-xs font-bold rounded-full">Not Configured</span>
                    )}
                  </div>
                  {integrations?.ai?.status === 'Configured' && (
                    <div className="mt-4 bg-surface-container-low p-3 rounded text-sm text-on-surface-variant font-mono">
                      Model: {integrations.ai.model}
                    </div>
                  )}
                  <p className="text-xs text-outline mt-3">Configuration is securely managed through backend environment variables.</p>
                </div>

                <div className="border border-outline-variant rounded-lg p-5 bg-surface opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
                        Git Repository Integration
                      </h4>
                      <p className="text-sm text-outline mt-1 max-w-md">Connect your code repositories for automated SAST scanning.</p>
                    </div>
                    <span className="px-3 py-1 bg-surface-variant text-outline text-xs font-bold rounded-full">Not Configured</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="p-6 bg-error/5 border border-error/20 rounded-xl shadow-sm">
              <h3 className="text-headline-sm font-bold text-error mb-2">Danger Zone</h3>
              <p className="text-sm text-on-surface-variant mb-6">Irreversible and destructive actions for your account.</p>
              
              <div className="bg-surface border border-error/20 p-5 rounded-lg">
                <h4 className="font-bold text-on-surface mb-2">Delete Account</h4>
                <p className="text-sm text-outline mb-4">
                  Once you delete your account, there is no going back. Please be certain. 
                  Shared project data will remain intact for other workspace members.
                </p>
                
                <div className="max-w-md">
                  <label className="block text-label-code-sm font-medium mb-1 text-on-surface">Confirm Password to Delete</label>
                  <input 
                    className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface focus:border-error outline-none transition-colors mb-4" 
                    type="password" 
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="px-6 h-10 rounded bg-error text-white font-bold hover:bg-error/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span> : <span className="material-symbols-outlined text-sm">delete_forever</span>}
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
