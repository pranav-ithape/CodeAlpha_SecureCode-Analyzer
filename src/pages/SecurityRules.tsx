import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';
import { useAuth } from '../contexts/AuthContext';

export interface Rule {
  _id: string;
  ruleId: string;
  name: string;
  category: string;
  severity: string;
  cwe: string;
  owasp: string;
  description: string;
  detectionPattern: string;
  vulnerableExample: string;
  secureExample: string;
  remediation: string;
  supportedLanguages: string[];
  confidence: string;
  tags: string[];
  status: 'Active' | 'Inactive';
}

const SecurityRules: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SECURITY_ANALYST';

  // State for confirm dialog and toasts
  const [ruleToDisable, setRuleToDisable] = useState<Rule | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchRules();
  }, []);

  useEffect(() => {
    const ruleIdQuery = searchParams.get('rule');
    if (ruleIdQuery && rules.length > 0) {
      const rule = rules.find(r => r.ruleId === ruleIdQuery);
      if (rule) {
        setSelectedRule(rule);
      }
    }
  }, [searchParams, rules]);

  const fetchRules = async () => {
    try {
      const res = await apiFetch('/api/rules');
      if (res.ok) {
        setRules(await res.json());
      } else {
        showToast('Unable to load security rules.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Unable to load security rules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleClick = (rule: Rule, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEdit) return;
    
    if (rule.status === 'Active') {
      setRuleToDisable(rule);
    } else {
      executeToggle(rule);
    }
  };

  const executeToggle = async (rule: Rule) => {
    const newStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await apiFetch(`/api/rules/${rule._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updatedRule = await res.json();
        setRules(rules.map(r => r._id === updatedRule._id ? updatedRule : r));
        if (selectedRule && selectedRule._id === updatedRule._id) {
          setSelectedRule(updatedRule);
        }
        showToast(
          newStatus === 'Active' ? 'Security rule enabled successfully.' : 'Security rule disabled successfully.',
          'success'
        );
      } else {
        showToast('Failed to update rule status.', 'error');
      }
    } catch (e) {
      console.error('Failed to update rule status', e);
      showToast('Failed to update rule status.', 'error');
    } finally {
      setRuleToDisable(null);
    }
  };

  const filteredRules = rules.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.name.toLowerCase().includes(q) &&
          !r.ruleId.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !r.cwe.toLowerCase().includes(q) &&
          !r.owasp.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (severityFilter && r.severity.toLowerCase() !== severityFilter.toLowerCase()) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (languageFilter && !r.supportedLanguages.some(l => l.toLowerCase() === languageFilter.toLowerCase()) && !r.supportedLanguages.includes('All') && languageFilter !== 'Configuration') return false;
    return true;
  });

  const categories = Array.from(new Set(rules.map(r => r.category))).sort();
  const languages = Array.from(new Set(rules.flatMap(r => r.supportedLanguages))).filter(l => l !== 'All').sort();
  const activeCount = rules.filter(r => r.status === 'Active').length;
  const criticalCount = rules.filter(r => r.severity.toLowerCase() === 'critical').length;
  const highCount = rules.filter(r => r.severity.toLowerCase() === 'high').length;

  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('');
    setCategoryFilter('');
    setLanguageFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6 pb-12 relative">
      <div className="flex justify-between items-end border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Security Rules</h1>
          <p className="text-on-surface-variant">Browse, configure, and manage rules used by the scanning engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-on-surface">{rules.length}</span>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Total Rules</span>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-green-500">{activeCount}</span>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Active</span>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-on-surface-variant">{rules.length - activeCount}</span>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-1">Inactive</span>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-error/30 shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-error">{criticalCount}</span>
          <span className="text-xs font-semibold text-error uppercase tracking-wider mt-1">Critical</span>
        </div>
        <div className="bg-surface-container p-4 rounded-xl border border-[rgb(249,115,22)]/30 shadow-sm flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[rgb(249,115,22)]">{highCount}</span>
          <span className="text-xs font-semibold text-[rgb(249,115,22)] uppercase tracking-wider mt-1">High</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            className="w-full h-10 pl-10 pr-4 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors shadow-sm"
            placeholder="Search rules, CWE, OWASP, descriptions..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="h-10 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="h-10 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary max-w-[200px] truncate" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="h-10 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
          <option value="">All Languages</option>
          {languages.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="h-10 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button onClick={clearFilters} className="h-10 px-3 text-sm bg-surface-container-high border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-sm">clear_all</span> Clear
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">search_off</span>
          <h3 className="text-headline-sm font-bold text-on-surface">
            {rules.length === 0 ? 'No security rules available.' : 'No rules match your search.'}
          </h3>
          {rules.length > 0 && (
            <>
              <p className="text-on-surface-variant max-w-sm mt-2">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="mt-4 text-primary font-medium hover:underline">Clear Filters</button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low shadow-sm">
          <table className="w-full text-left text-sm text-on-surface">
            <thead className="bg-surface-container border-b border-outline-variant font-semibold">
              <tr>
                <th className="px-4 py-3">Rule ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule._id} onClick={() => setSelectedRule(rule)} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-highest transition-colors cursor-pointer group">
                  <td className="px-4 py-3 font-mono text-xs text-secondary font-medium group-hover:text-primary transition-colors">{rule.ruleId}</td>
                  <td className="px-4 py-3 font-medium">{rule.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">{rule.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      rule.severity.toUpperCase() === 'CRITICAL' ? 'bg-error text-white' : 
                      rule.severity.toUpperCase() === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
                      rule.severity.toUpperCase() === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {canEdit ? (
                      <button 
                        onClick={(e) => handleToggleClick(rule, e)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${rule.status === 'Active' ? 'bg-primary' : 'bg-outline-variant'}`}
                        title={rule.status === 'Active' ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rule.status === 'Active' ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    ) : (
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                        rule.status === 'Active' ? 'border-primary text-primary bg-primary/10' : 'border-outline text-outline bg-surface-container'
                      }`}>
                        {rule.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rule Details Modal */}
      {selectedRule && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-start bg-surface-container-low">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-secondary bg-secondary/10 px-2 py-1 rounded font-bold tracking-wider">{selectedRule.ruleId}</span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    selectedRule.severity.toUpperCase() === 'CRITICAL' ? 'bg-error text-white' : 
                    selectedRule.severity.toUpperCase() === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
                    selectedRule.severity.toUpperCase() === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
                    'bg-blue-500 text-white'
                  }`}>
                    {selectedRule.severity}
                  </span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    selectedRule.status === 'Active' ? 'border-primary text-primary bg-primary/10' : 'border-outline text-outline bg-surface-container'
                  }`}>
                    {selectedRule.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-on-surface">{selectedRule.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <button 
                    onClick={() => handleToggleClick(selectedRule)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors border ${
                      selectedRule.status === 'Active' ? 'bg-surface-container border-outline text-on-surface hover:bg-surface-container-highest' : 'bg-primary border-primary text-on-primary hover:bg-primary-fixed-dim'
                    }`}
                  >
                    {selectedRule.status === 'Active' ? 'Disable Rule' : 'Enable Rule'}
                  </button>
                )}
                <button 
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                  onClick={() => {
                    setSelectedRule(null);
                    if (searchParams.has('rule')) {
                      setSearchParams({});
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Metadata row */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/50 flex-1 min-w-[150px]">
                  <p className="text-xs text-outline mb-1 font-semibold uppercase">Category</p>
                  <p className="text-sm font-medium text-on-surface">{selectedRule.category}</p>
                </div>
                <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/50 flex-1 min-w-[150px]">
                  <p className="text-xs text-outline mb-1 font-semibold uppercase">CWE Mapping</p>
                  <p className="text-sm font-mono text-secondary">{selectedRule.cwe}</p>
                </div>
                <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/50 flex-1 min-w-[150px]">
                  <p className="text-xs text-outline mb-1 font-semibold uppercase">OWASP</p>
                  <p className="text-sm font-medium text-on-surface">{selectedRule.owasp}</p>
                </div>
                <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/50 flex-1 min-w-[150px]">
                  <p className="text-xs text-outline mb-1 font-semibold uppercase">Scanner</p>
                  <p className="text-sm font-medium text-on-surface">Custom / Regex</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-1">Description</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{selectedRule.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-1">Detection Logic</h3>
                <div className="bg-surface-container p-3 rounded-lg border border-outline-variant font-mono text-sm text-secondary overflow-x-auto whitespace-pre-wrap">
                  {selectedRule.detectionPattern}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-error mb-2 border-b border-outline-variant pb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">cancel</span> Vulnerable Example
                  </h3>
                  <div className="bg-[#1e1e1e] p-4 rounded-lg border border-error/30 font-mono text-xs text-[#d4d4d4] overflow-x-auto whitespace-pre-wrap">
                    {selectedRule.vulnerableExample}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-500 mb-2 border-b border-outline-variant pb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Secure Example
                  </h3>
                  <div className="bg-[#1e1e1e] p-4 rounded-lg border border-green-500/30 font-mono text-xs text-[#d4d4d4] overflow-x-auto whitespace-pre-wrap">
                    {selectedRule.secureExample}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-1">Secure Coding Recommendation</h3>
                <div className="bg-surface-container px-5 py-4 rounded-lg border border-outline-variant/50 text-sm text-on-surface-variant leading-relaxed">
                  {selectedRule.remediation}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2 border-b border-outline-variant pb-1">Supported Languages & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRule.supportedLanguages.map(lang => (
                    <span key={lang} className="px-2 py-1 bg-surface-container border border-outline-variant rounded text-xs font-medium text-on-surface">{lang}</span>
                  ))}
                  {selectedRule.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-primary/10 border border-primary/20 rounded text-xs font-medium text-primary">#{tag}</span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog */}
      {ruleToDisable && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Disable Security Rule?</h3>
            </div>
            
            <p className="text-on-surface-variant text-sm mb-4">
              Disabling <span className="font-bold text-on-surface">{ruleToDisable.ruleId}</span> means future scans will no longer check for this security issue.
            </p>
            <p className="text-on-surface-variant text-sm mb-6">
              Existing findings will <span className="font-bold text-on-surface">not</span> be deleted.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRuleToDisable(null)}
                className="px-4 py-2 rounded-lg font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => executeToggle(ruleToDisable)}
                className="px-4 py-2 rounded-lg font-medium bg-error text-white hover:bg-error/90 transition-colors shadow-sm"
              >
                Disable Rule
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 z-[120] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' ? 'bg-surface-container border-green-500/30 text-on-surface' : 'bg-surface-container border-error/30 text-error'
          }`}>
            <span className={`material-symbols-outlined text-lg ${toast.type === 'success' ? 'text-green-500' : 'text-error'}`}>
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default SecurityRules;
