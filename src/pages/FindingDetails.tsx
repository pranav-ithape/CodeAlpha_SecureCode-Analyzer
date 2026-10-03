import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';
export interface Finding {
  id: string;
  scan_id: string;
  project_id: string;
  project_name: string;
  title: string;
  description: string;
  severity: string;
  cwe: string;
  owasp_category: string;
  scanner: string;
  rule_id: string;
  file_name: string;
  line_number: number;
  code_snippet: string;
  impact: string;
  recommendation: string;
  status: string;
  reviewerComment?: string;
  reviewerName?: string;
  reviewTimestamp?: string;
  created_at: string;
  updated_at: string;
}

const FindingDetails: React.FC = () => {
  const { findingId } = useParams<{ findingId: string }>();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchFinding();
  }, [findingId]);

  const fetchFinding = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/findings/${findingId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch finding details');
      }
      const data = await res.json();
      setFinding(data);
      if (data.reviewerComment) setReviewComment(data.reviewerComment);
    } catch (err: any) {
      setError(err.message || 'Error loading finding');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/findings/${findingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewerComment: reviewComment })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      // Refresh finding data
      await fetchFinding();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
      </div>
    );
  }

  if (error || !finding) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Error</h2>
        <p className="text-on-surface-variant mb-6">{error || 'Finding not found'}</p>
        <Link to="/findings" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-fixed-dim transition-colors">
          Return to Findings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex justify-between items-end border-b border-outline-variant pb-4">
        <div>
          <Link to="/findings" className="text-sm text-outline hover:text-primary flex items-center gap-1 mb-2 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Findings
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              finding.severity.toUpperCase() === 'CRITICAL' ? 'bg-error text-white' : 
              finding.severity.toUpperCase() === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
              finding.severity.toUpperCase() === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
              'bg-blue-500 text-white'
            }`}>
              {finding.severity}
            </span>
            <h1 className="text-headline-sm font-bold text-on-surface">{finding.title}</h1>
          </div>
          <p className="text-on-surface-variant mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">folder</span> {finding.project_name} 
            <span className="text-outline">•</span> 
            <span className="font-mono text-xs text-secondary">{finding.cwe}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-outline font-medium">Status:</span>
          <select 
            value={finding.status} 
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            className={`h-9 px-3 bg-surface-container border rounded text-sm font-medium outline-none transition-colors ${
              finding.status === 'Resolved' ? 'border-green-500/50 text-green-500 bg-green-500/10' :
              finding.status === 'False Positive' ? 'border-outline text-outline bg-surface-container-high' :
              'border-outline-variant text-on-surface focus:border-primary'
            }`}
          >
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Description</h2>
            <p className="text-on-surface-variant whitespace-pre-wrap">{finding.description}</p>
          </div>

          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Impact & Recommendation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-1">Impact</h3>
                <p className="text-sm text-on-surface-variant">{finding.impact}</p>
              </div>
              <div className="border-t border-outline-variant pt-4">
                <h3 className="text-sm font-bold text-on-surface mb-1">Recommendation</h3>
                <p className="text-sm text-on-surface-variant">{finding.recommendation}</p>
              </div>
            </div>
          </div>

          {finding.code_snippet && (
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface mb-4">Vulnerable Code</h2>
              <pre className="p-4 bg-[#080C13] rounded-lg overflow-x-auto border border-outline-variant">
                <code className="text-sm font-mono text-on-surface">{finding.code_snippet}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Finding Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-outline block mb-1">CWE</span>
                <span className="text-on-surface font-mono">{finding.cwe}</span>
              </div>
              <div>
                <span className="text-outline block mb-1">Rule ID</span>
                {finding.rule_id ? (
                  <Link to={`/security-rules?rule=${finding.rule_id}`} className="text-primary hover:underline font-mono">
                    {finding.rule_id}
                  </Link>
                ) : (
                  <span className="text-on-surface-variant italic">N/A</span>
                )}
              </div>
              <div>
                <span className="text-outline block mb-1">OWASP Category</span>
                <span className="text-on-surface font-mono">{finding.owasp_category}</span>
              </div>
              <div>
                <span className="text-outline block mb-1">Scanner</span>
                <span className="text-on-surface">{finding.scanner}</span>
              </div>
              <div>
                <span className="text-outline block mb-1">File</span>
                <span className="text-on-surface font-mono break-all">{finding.file_name}</span>
              </div>
              <div>
                <span className="text-outline block mb-1">Line Number</span>
                <span className="text-on-surface font-mono">{finding.line_number}</span>
              </div>
              <div>
                <span className="text-outline block mb-1">Discovered At</span>
                <span className="text-on-surface">{new Date(finding.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Manual Review</h2>
            <div className="space-y-4">
              {finding.reviewerName && (
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-on-surface">Last Reviewer</span>
                    <span className="text-outline">{new Date(finding.reviewTimestamp!).toLocaleDateString()}</span>
                  </div>
                  <span className="text-on-surface-variant">{finding.reviewerName}</span>
                </div>
              )}
              <div className="pt-2">
                <label className="text-sm font-semibold text-on-surface block mb-2">Reviewer Comment</label>
                <textarea 
                  className="w-full h-24 p-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm placeholder:text-outline focus:border-primary outline-none resize-none"
                  placeholder="Add your review notes or justification here..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                ></textarea>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => updateStatus(finding.status)}
                    disabled={updating}
                    className="px-4 py-1.5 bg-surface-container-highest border border-outline-variant hover:border-primary text-on-surface text-sm font-semibold rounded transition-colors"
                  >
                    {updating ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindingDetails;
