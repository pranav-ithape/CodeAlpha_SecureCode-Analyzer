import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const Settings: React.FC = () => {
  const { user, logout, login } = useAuth(); 
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security' | 'policies' | 'integrations' | 'danger'>('profile');
  
  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  
  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop States
  const [photoToCrop, setPhotoToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  // Settings / Policies states
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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const res = await apiFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const u = data.user;
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setUsername(u.username || '');
        setEmail(u.email || '');
        setDisplayName(u.displayName || '');
        setPhone(u.phone || '');
        setJobTitle(u.jobTitle || '');
        setCompany(u.company || '');
        setLocation(u.location || '');
        setBio(u.bio || '');
        setWebsite(u.website || '');
        setLinkedin(u.linkedin || '');
        setGithub(u.github || '');
      }

      // Fetch settings/integrations
      const setRes = await apiFetch('/api/settings');
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.settings && setData.settings.policies) {
          setPolicies(setData.settings.policies);
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
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !username.trim()) {
      showMessage('error', 'First Name, Last Name, Username and Email are required.');
      return;
    }
    
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (website && !urlPattern.test(website)) {
      showMessage('error', 'Please enter a valid Website URL.');
      return;
    }
    if (linkedin && !urlPattern.test(linkedin)) {
      showMessage('error', 'Please enter a valid LinkedIn URL.');
      return;
    }
    if (github && !urlPattern.test(github)) {
      showMessage('error', 'Please enter a valid GitHub URL.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName, lastName, username, email, displayName,
        phone, jobTitle, company, location, bio,
        website, linkedin, github
      };
      
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Profile updated successfully.');
        login(localStorage.getItem('token') || '', { ...user!, ...data.user });
      } else {
        showMessage('error', data.error || 'Failed to update profile.');
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
    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', data.error || 'Failed to update password.');
      }
    } catch (err) {
      showMessage('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Image size must be less than 2MB.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showMessage('error', 'Only JPG, PNG and WebP formats are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Str = event.target?.result as string;
      setPhotoToCrop(base64Str);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!photoToCrop || !croppedAreaPixels) return;
    
    setUploading(true);
    try {
      const croppedImageBase64 = await getCroppedImg(photoToCrop, croppedAreaPixels, rotation);
      if (!croppedImageBase64) throw new Error('Crop failed');

      const res = await apiFetch('/api/profile/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: croppedImageBase64 })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Profile photo updated successfully.');
        login(localStorage.getItem('token') || '', { ...user!, profileImage: croppedImageBase64 });
        setPhotoToCrop(null);
      } else {
        showMessage('error', data.error || 'Failed to update photo.');
      }
    } catch (err) {
      showMessage('error', 'Network error during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    setUploading(true);
    try {
      const res = await apiFetch('/api/profile/photo', {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Profile photo removed successfully.');
        login(localStorage.getItem('token') || '', { ...user!, profileImage: undefined });
      } else {
        showMessage('error', data.error || 'Failed to remove photo.');
      }
    } catch (err) {
      showMessage('error', 'Network error.');
    } finally {
      setUploading(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { text: '', color: '' };
    if (pass.length < 6) return { text: 'Weak', color: 'text-error' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) return { text: 'Strong', color: 'text-green-500' };
    return { text: 'Fair', color: 'text-[rgb(234,179,8)]' };
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
      <div className="border-b border-outline-variant pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Settings</h1>
          <p className="text-on-surface-variant mt-1">Manage your account profile, security, and workspace preferences.</p>
        </div>
        
        {/* Profile Header Block */}
        <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-lg border border-outline-variant">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center font-bold text-lg text-primary border border-outline-variant">
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (firstName || user?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="font-bold text-on-surface leading-tight">{firstName ? `${firstName} ${lastName}`.trim() : user?.name}</div>
            <div className="text-xs text-outline">{email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold uppercase">{user?.role || 'Developer'}</span>
            </div>
          </div>
        </div>
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
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              Edit Profile
            </li>
            <li 
              onClick={() => setActiveTab('account')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'account' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              Account Info
            </li>
            <li 
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[18px]">security</span>
              Security
            </li>
            {user?.role === 'ADMIN' && (
              <li 
                onClick={() => setActiveTab('policies')}
                className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'policies' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-[18px]">policy</span>
                Policies
              </li>
            )}
            <li 
              onClick={() => setActiveTab('integrations')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'integrations' ? 'bg-surface-container-high text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[18px]">api</span>
              Integrations
            </li>
            <li 
              onClick={() => setActiveTab('danger')}
              className={`px-3 py-2 rounded font-medium cursor-pointer transition-colors mt-6 flex items-center gap-2 ${activeTab === 'danger' ? 'bg-error/10 text-error border-l-2 border-error' : 'text-error hover:bg-error/5 hover:text-error'}`}
            >
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Danger Zone
            </li>
          </ul>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant flex-shrink-0 text-primary font-bold text-3xl">
                  {uploading ? (
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
                  ) : user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (firstName || user?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">Profile Photo</h3>
                  <p className="text-sm text-on-surface-variant mb-4">Upload a high resolution avatar. JPG, PNG or WebP under 2MB.</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-1.5 rounded-lg bg-surface border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoUpload} />
                    
                    {user?.profileImage && (
                      <button 
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                        className="px-4 py-1.5 rounded-lg bg-error/10 text-error text-sm font-semibold hover:bg-error/20 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
                <h3 className="text-headline-sm font-bold mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">First Name <span className="text-error">*</span></label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Last Name <span className="text-error">*</span></label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={lastName} onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Username <span className="text-error">*</span></label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={username} onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Email <span className="text-error">*</span></label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="email" 
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Display Name</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. CodeNinja"
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Phone Number</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <h3 className="text-headline-sm font-bold mb-4 pt-4 border-t border-outline-variant">Work Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Job Title / Role</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Company / Organization</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={company} onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-label-code-sm font-medium mb-1">Location</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="text" 
                      value={location} onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-label-code-sm font-medium mb-1">Bio</label>
                    <textarea 
                      className="w-full h-24 p-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors resize-none" 
                      value={bio} onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                    />
                    <div className="text-right text-xs text-outline mt-1">{bio.length}/500</div>
                  </div>
                </div>

                <h3 className="text-headline-sm font-bold mb-4 pt-4 border-t border-outline-variant">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Website / Portfolio URL</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="url" placeholder="https://"
                      value={website} onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">LinkedIn URL</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="url" placeholder="https://linkedin.com/in/..."
                      value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">GitHub URL</label>
                    <input 
                      className="w-full h-10 px-3 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                      type="url" placeholder="https://github.com/..."
                      value={github} onChange={(e) => setGithub(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-outline-variant flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 h-10 rounded bg-primary text-on-primary font-bold hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>}
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
              <h3 className="text-headline-sm font-bold mb-6">Account Information</h3>
              <p className="text-sm text-on-surface-variant mb-6">This information is managed by the system and cannot be directly edited.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="text-outline font-medium mb-1">User ID</div>
                  <div className="text-on-surface font-mono">{user?.id}</div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="text-outline font-medium mb-1">System Role</div>
                  <div className="text-on-surface font-mono">{user?.role}</div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="text-outline font-medium mb-1">Account Status</div>
                  <div className="text-green-500 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Active
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="text-outline font-medium mb-1">Account Created</div>
                  <div className="text-on-surface">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="text-outline font-medium mb-1">Email Address</div>
                  <div className="text-on-surface">{user?.email}</div>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                  <div className="text-outline font-medium mb-1">Username</div>
                  <div className="text-on-surface">{username || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
                <h3 className="text-headline-sm font-bold mb-2">Change Password</h3>
                <p className="text-sm text-on-surface-variant mb-6">Ensure your account is using a long, random password to stay secure.</p>
                
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Current Password <span className="text-error">*</span></label>
                    <div className="relative">
                      <input 
                        className="w-full h-10 px-3 pr-10 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                        type={showPasswords ? "text" : "password"} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">New Password <span className="text-error">*</span></label>
                    <div className="relative">
                      <input 
                        className="w-full h-10 px-3 pr-10 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                        type={showPasswords ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    {newPassword && (
                      <div className={`text-xs mt-1 font-medium ${getPasswordStrength(newPassword).color}`}>
                        Strength: {getPasswordStrength(newPassword).text}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-label-code-sm font-medium mb-1">Confirm New Password <span className="text-error">*</span></label>
                    <div className="relative">
                      <input 
                        className="w-full h-10 px-3 pr-10 bg-surface border border-outline-variant rounded text-on-surface focus:border-primary outline-none transition-colors" 
                        type={showPasswords ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="show-passwords" checked={showPasswords} onChange={() => setShowPasswords(!showPasswords)} className="rounded bg-surface border-outline-variant" />
                    <label htmlFor="show-passwords" className="text-sm text-on-surface-variant cursor-pointer">Show passwords</label>
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

              <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl shadow-sm">
                <h3 className="text-headline-sm font-bold mb-4">Active Sessions</h3>
                <div className="bg-surface p-4 rounded-lg border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-primary">laptop_mac</span>
                    <div>
                      <div className="font-semibold text-on-surface">Current Session</div>
                      <div className="text-sm text-outline">You are currently logged in from this device.</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">Active Now</span>
                </div>
                
                <div className="mt-6 pt-4 border-t border-outline-variant">
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-surface border border-outline-variant text-error text-sm font-semibold hover:bg-error/10 hover:border-error transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Logout from Current Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Policies Tab (ADMIN only) */}
          {activeTab === 'policies' && user?.role === 'ADMIN' && (
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
      
      {/* Crop Modal */}
      {photoToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col h-[80vh]">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
              <h3 className="font-bold text-lg text-on-surface">Edit Profile Photo</h3>
              <button onClick={() => setPhotoToCrop(null)} className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="relative flex-1 bg-black/90">
              <Cropper
                image={photoToCrop}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>
            
            <div className="p-6 bg-surface border-t border-outline-variant space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-2">Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-2 flex justify-between">
                  <span>Rotation</span>
                  <span>{rotation}°</span>
                </label>
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setPhotoToCrop(null)}
                  className="px-4 py-2 rounded font-medium border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCroppedImage}
                  disabled={uploading}
                  className="px-6 py-2 rounded font-bold bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>}
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
