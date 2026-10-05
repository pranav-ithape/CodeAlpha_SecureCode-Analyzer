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
  reviewStatus: string;
  decision: string | null;
  reviewerRisk: string | null;
  manualReviewComments: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  summary: string;
  whyVulnerable: string;
  securityImpact: string;
  rootCause?: string;
  recommendation: string;
  secureCodingPractices: string[];
  secureCodeExample: string;
  verificationSteps: string[];
  references?: string[];
  confidence?: number;
  aiModel?: string;
  updatedAt?: string;
}

const FindingDetails: React.FC = () => {
  const { findingId } = useParams<{ findingId: string }>();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  
  const [manualDecision, setManualDecision] = useState<string>('');
  const [manualRisk, setManualRisk] = useState<string>('');

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinding();
    fetchAIAnalysis();
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
      if (data.manualReviewComments) setReviewComment(data.manualReviewComments);
      if (data.decision) setManualDecision(data.decision);
      if (data.reviewerRisk) setManualRisk(data.reviewerRisk);
    } catch (err: any) {
      setError(err.message || 'Error loading finding');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIAnalysis = async () => {
    try {
      const res = await apiFetch(`/api/ai/analysis/${findingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setAiAnalysis(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
    }
  };

  const generateAIRecommendation = async () => {
    setGeneratingAI(true);
    setAiError(null);
    try {
      const res = await apiFetch(`/api/ai/analyze/${findingId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok || data.success === false || data.error) {
        throw new Error(data.message || data.error || 'Failed to generate AI analysis');
      }
      setAiAnalysis(data.data);
    } catch (err: any) {
      setAiError(err.message || 'AI analysis is currently unavailable. The original security finding is still available.');
    } finally {
      setGeneratingAI(false);
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

  const saveManualReview = async () => {
    if (!manualDecision || !manualRisk || !reviewComment) {
      alert('Decision, Reviewer Risk, and Comments are required to save a manual review.');
      return;
    }
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/manual-reviews/${findingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: manualDecision,
          reviewerRisk: manualRisk,
          comments: reviewComment
        })
      });
      if (!res.ok) throw new Error('Failed to save manual review');
      
      // Also update the finding status based on decision
      const statusMap: any = {
        'TRUE_POSITIVE': 'Confirmed',
        'FALSE_POSITIVE': 'False Positive',
        'NEEDS_INVESTIGATION': 'Under Review'
      };
      
      const newStatus = statusMap[manualDecision] || finding!.status;
      
      if (newStatus !== finding!.status) {
        await apiFetch(`/api/findings/${findingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      }

      await fetchFinding();
      alert('Review saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Error saving review');
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
    <div className="space-y-6 pb-12">
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
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-on-surface">Description</h2>
              <button
                onClick={generateAIRecommendation}
                disabled={generatingAI}
                className={`px-4 py-1.5 flex items-center gap-2 rounded-lg text-sm font-semibold transition-all ${
                  generatingAI ? 'bg-surface-variant text-outline cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${generatingAI ? 'animate-spin' : ''}`}>
                  {generatingAI ? 'sync' : 'smart_toy'}
                </span>
                {generatingAI ? 'Generating security recommendation...' : (aiAnalysis ? 'Regenerate AI Analysis' : 'Generate AI Recommendation')}
              </button>
            </div>
            <p className="text-on-surface-variant whitespace-pre-wrap">{finding.description}</p>
          </div>

          {/* AI Analysis Section */}
          {(aiAnalysis || aiError) && (
            <div className="p-6 rounded-xl bg-surface-container border border-primary/30 shadow-[0_0_15px_rgba(173,198,255,0.05)]">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                <h2 className="text-lg font-bold text-on-surface">AI Security Analysis</h2>
              </div>
              
              {aiError ? (
                <div className="p-4 bg-error-container text-on-error-container rounded-lg flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-error">warning</span>
                  <p className="text-sm">{aiError}</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Summary</h3>
                    <p className="text-sm text-on-surface-variant">{aiAnalysis.summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Why is this vulnerable?</h3>
                    <p className="text-sm text-on-surface-variant">{aiAnalysis.whyVulnerable}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-1">Security Impact</h3>
                    <p className="text-sm text-on-surface-variant">{aiAnalysis.securityImpact}</p>
                  </div>
                  
                  {aiAnalysis.rootCause && (
                    <div>
                      <h3 className="text-sm font-bold text-on-surface mb-1">Root Cause</h3>
                      <p className="text-sm text-on-surface-variant">{aiAnalysis.rootCause}</p>
                    </div>
                  )}
                  
                  <div className="border-t border-outline-variant pt-4">
                    <h3 className="text-sm font-bold text-on-surface mb-1">Recommendation</h3>
                    <p className="text-sm text-on-surface-variant">{aiAnalysis.recommendation}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-2">Secure Coding Practices</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
                      {aiAnalysis.secureCodingPractices.map((practice, idx) => (
                        <li key={idx}>{practice}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-on-surface mb-2">Secure Code Example</h3>
                    <pre className="p-4 bg-surface-container-lowest rounded-lg overflow-x-auto border border-outline-variant">
                      <code className="text-sm font-mono text-on-surface">{aiAnalysis.secureCodeExample}</code>
                    </pre>
                  </div>

                  <div className="border-t border-outline-variant pt-4">
                    <h3 className="text-sm font-bold text-on-surface mb-2">Verification Steps</h3>
                    <ul className="list-decimal pl-5 space-y-1 text-sm text-on-surface-variant">
                      {aiAnalysis.verificationSteps && aiAnalysis.verificationSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {aiAnalysis.references && aiAnalysis.references.length > 0 && (
                    <div className="border-t border-outline-variant pt-4">
                      <h3 className="text-sm font-bold text-on-surface mb-2">References</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
                        {aiAnalysis.references.map((ref, idx) => (
                          <li key={idx}><a href={ref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{ref}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant text-xs text-outline justify-end">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    <span>AI Model: {aiAnalysis.aiModel || 'Gemini'}</span>
                    {aiAnalysis.updatedAt && (
                      <>
                        <span className="text-outline-variant">•</span>
                        <span>Generated: {new Date(aiAnalysis.updatedAt).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Original Impact & Recommendation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-on-surface mb-1">Impact</h3>
                <p className="text-sm text-on-surface-variant">{finding.impact}</p>
              </div>
              <div className="border-t border-outline-variant pt-4">
                <h3 className="text-sm font-bold text-on-surface mb-1">Recommendation</h3>
                <p className="text-sm text-on-surface-variant mb-4">{finding.recommendation}</p>
                <Link 
                  to={`/secure-coding-guide?search=${finding.cwe}`} 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                  Learn Secure Coding Practice
                </Link>
              </div>
            </div>
          </div>

          {finding.code_snippet && (
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface mb-4">Vulnerable Code</h2>
              <pre className="p-4 bg-surface-container-lowest rounded-lg overflow-x-auto border border-outline-variant">
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
            <h2 className="text-lg font-bold text-on-surface mb-4">Manual Security Review</h2>
            <div className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Review Decision <span className="text-error">*</span></label>
                <select 
                  className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none"
                  value={manualDecision}
                  onChange={e => setManualDecision(e.target.value)}
                >
                  <option value="" disabled>Select Decision</option>
                  <option value="TRUE_POSITIVE">True Positive</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                  <option value="NEEDS_INVESTIGATION">Needs Investigation</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">Reviewer Risk <span className="text-error">*</span></label>
                <select 
                  className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none"
                  value={manualRisk}
                  onChange={e => setManualRisk(e.target.value)}
                >
                  <option value="" disabled>Select Risk</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="text-sm font-semibold text-on-surface block mb-2">Reviewer Comments <span className="text-error">*</span></label>
                <textarea 
                  className="w-full h-24 p-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm placeholder:text-outline focus:border-primary outline-none resize-none"
                  placeholder="Explain your decision..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                ></textarea>
                <div className="flex justify-end mt-2 gap-3">
                  <button 
                    onClick={saveManualReview}
                    disabled={updating}
                    className={`px-4 py-1.5 rounded transition-colors text-sm font-semibold ${
                      manualDecision && manualRisk && reviewComment
                        ? 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                        : 'bg-surface-container-highest border border-outline-variant text-outline cursor-not-allowed'
                    }`}
                  >
                    {updating ? 'Saving...' : 'Save Review'}
                  </button>
                </div>
              </div>
              
              {finding.decision && (
                <div className="mt-4 p-4 rounded-lg bg-surface-container-high border border-outline-variant text-sm">
                  <h4 className="font-semibold text-on-surface mb-2">Current Review Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-outline">Decision:</span>
                    <span className="text-on-surface font-medium">{finding.decision === 'TRUE_POSITIVE' ? 'True Positive' : finding.decision === 'FALSE_POSITIVE' ? 'False Positive' : 'Needs Investigation'}</span>
                    <span className="text-outline">Reviewer Risk:</span>
                    <span className="text-on-surface font-medium">{finding.reviewerRisk}</span>
                    <span className="text-outline">Status:</span>
                    <span className="text-on-surface font-medium">{finding.reviewStatus}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindingDetails;
