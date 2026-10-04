import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { guides, SECURE_CODING_CATEGORIES } from '../data/secureCodingGuides';

const SecureCodingGuide: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const guideId = searchParams.get('guide');

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [languageFilter, setLanguageFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [cweFilter, setCweFilter] = useState('');
  const [owaspFilter, setOwaspFilter] = useState('');
  const [sortBy, setSortBy] = useState('Relevant');

  // Derived filters for dropdowns based on available data
  const cweOptions = Array.from(new Set(guides.map(g => g.cwe))).sort();
  const owaspOptions = Array.from(new Set(guides.map(g => g.owasp))).sort();
  
  // Bookmarks state (persisted locally)
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('sca_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sca_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const filteredGuides = useMemo(() => {
    let result = guides;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.cwe.toLowerCase().includes(q) ||
        g.owasp.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q)
      );
    }

    if (languageFilter) {
      result = result.filter(g => g.languages.includes(languageFilter));
    }
    if (categoryFilter) {
      result = result.filter(g => g.category === categoryFilter);
    }
    if (severityFilter) {
      result = result.filter(g => g.severity === severityFilter);
    }
    if (cweFilter) {
      result = result.filter(g => g.cwe === cweFilter);
    }
    if (owaspFilter) {
      result = result.filter(g => g.owasp === owaspFilter);
    }

    // Sort
    if (sortBy === 'Alphabetical') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [searchQuery, languageFilter, categoryFilter, severityFilter, cweFilter, owaspFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilter('');
    setCategoryFilter('');
    setSeverityFilter('');
    setCweFilter('');
    setOwaspFilter('');
  };

  if (guideId) {
    const guide = guides.find(g => g.id === guideId);
    if (!guide) {
      return (
        <div className="p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl mb-4 text-outline">error</span>
          <h2 className="text-xl font-bold text-on-surface">Guide not found</h2>
          <button onClick={() => setSearchParams({})} className="mt-4 text-primary hover:underline">Return to guides</button>
        </div>
      );
    }

    const isBookmarked = bookmarks.includes(guide.id);

    return (
      <div className="pb-12 max-w-5xl mx-auto space-y-8">
        <button 
          onClick={() => setSearchParams({})}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Secure Coding Guide
        </button>

        {/* ARTICLE HEADER */}
        <div className="border-b border-outline-variant pb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-surface-container rounded border border-outline-variant text-xs font-bold text-on-surface uppercase tracking-wider">{guide.category}</span>
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
              guide.severity === 'Critical' ? 'bg-error text-white' : 
              guide.severity === 'High' ? 'bg-[#f97316] text-white' :
              guide.severity === 'Medium' ? 'bg-[#eab308] text-black' :
              'bg-blue-500 text-white'
            }`}>
              {guide.severity}
            </span>
            <span className="px-2 py-1 bg-primary/10 rounded border border-primary/20 text-xs font-mono font-semibold text-primary">{guide.cwe}</span>
            <span className="px-2 py-1 bg-surface-container rounded border border-outline-variant text-xs font-semibold text-on-surface">{guide.owasp}</span>
          </div>

          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-bold text-on-surface leading-tight max-w-3xl">{guide.title}</h1>
            <button 
              onClick={() => toggleBookmark(guide.id)}
              className="p-2 bg-surface-container-high rounded-full border border-outline-variant text-on-surface hover:text-primary transition-colors flex-shrink-0"
              title={isBookmarked ? "Remove bookmark" : "Bookmark this guide"}
            >
              <span className={`material-symbols-outlined ${isBookmarked ? 'text-primary' : ''}`} style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                bookmark
              </span>
            </button>
          </div>

          <p className="mt-4 text-lg text-on-surface-variant">{guide.summary}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-outline mr-2 self-center">Affected Languages:</span>
            {guide.languages.map(lang => (
              <span key={lang} className="px-2 py-1 bg-surface-container-high rounded border border-outline-variant text-xs font-medium text-on-surface-variant">{lang}</span>
            ))}
          </div>
        </div>

        {/* 1. WHAT IS IT? */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">help</span>
            1. What Is It?
          </h2>
          <p className="text-on-surface-variant leading-relaxed text-body-md">{guide.whatIsIt}</p>
        </section>

        {/* 2. WHY DOES IT MATTER? */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">warning</span>
            2. Why Does It Matter?
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-on-surface-variant text-body-md">
            {guide.whyItMatters.map((point, idx) => <li key={idx}>{point}</li>)}
          </ul>
        </section>

        {/* 3. HOW IT HAPPENS */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">account_tree</span>
            3. How It Happens
          </h2>
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant font-mono text-sm text-secondary overflow-x-auto whitespace-pre-wrap">
            {guide.howItHappens}
          </div>
        </section>

        {/* 4. VULNERABLE CODE & 5. WHY THE CODE IS VULNERABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-error mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">code_off</span>
              4. Vulnerable Code
            </h2>
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-error/30 overflow-x-auto">
              <pre className="font-mono text-sm text-[#d4d4d4] m-0"><code className={`language-${guide.vulnerableCode.language}`}>{guide.vulnerableCode.code}</code></pre>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">analytics</span>
              5. Why The Code Is Vulnerable
            </h2>
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant h-full">
              <ul className="list-disc pl-5 space-y-3 text-on-surface-variant text-sm">
                {guide.whyIsItVulnerable.map((reason, idx) => <li key={idx}>{reason}</li>)}
              </ul>
            </div>
          </section>
        </div>

        {/* 6. SECURE CODE & 7. PRINCIPLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-green-500 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">code</span>
              6. Secure Code
            </h2>
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-green-500/30 overflow-x-auto">
              <pre className="font-mono text-sm text-[#d4d4d4] m-0"><code className={`language-${guide.secureCode.language}`}>{guide.secureCode.code}</code></pre>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">gavel</span>
              7. Secure Coding Principles
            </h2>
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant h-full">
              <ul className="list-disc pl-5 space-y-3 text-on-surface-variant text-sm">
                {guide.principles.map((principle, idx) => <li key={idx}>{principle}</li>)}
              </ul>
            </div>
          </section>
        </div>

        {/* 8. PREVENTION CHECKLIST */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
            8. Prevention Checklist
          </h2>
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant">
            <ul className="space-y-3">
              {guide.preventionChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5 text-[20px]">check_box_outline_blank</span>
                  <span className="text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 9. DETECTION & 10. TESTING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">radar</span>
              9. Detection
            </h2>
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant space-y-4 h-full">
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Static Analysis</h4>
                <ul className="list-disc pl-5 text-sm text-on-surface-variant">
                  {guide.detection.static.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Manual Review</h4>
                <ul className="list-disc pl-5 text-sm text-on-surface-variant">
                  {guide.detection.manual.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-1">Tools</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {guide.detection.tools.map((t, i) => <span key={i} className="px-2 py-1 bg-surface-container border border-outline-variant rounded text-xs">{t}</span>)}
                </div>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">science</span>
              10. Security Testing
            </h2>
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant h-full">
              <p className="text-sm text-on-surface-variant leading-relaxed">{guide.testing}</p>
              <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
                <p className="text-xs text-error font-medium leading-relaxed">Do not provide instructions for attacking unauthorized systems. Security testing must only be performed in authorized, isolated environments.</p>
              </div>
            </div>
          </section>
        </div>

        {/* 11. REMEDIATION */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500 text-xl">build</span>
            11. Remediation
          </h2>
          <div className="bg-surface-container p-6 rounded-xl border border-outline-variant">
            <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant">
              {guide.remediation.map((step, idx) => (
                <li key={idx} className="pl-2">{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* 12. COMMON MISTAKES & 13. SECURE ALTERNATIVES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-xl">cancel</span>
              12. Common Mistakes
            </h2>
            <div className="space-y-4">
              {guide.commonMistakes.map((mistake, idx) => (
                <div key={idx} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                  <h4 className="text-sm font-bold text-error mb-1">{mistake.mistake}</h4>
                  <p className="text-sm text-on-surface-variant">{mistake.why}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500 text-xl">swap_calls</span>
              13. Secure Alternatives
            </h2>
            <div className="space-y-4">
              {guide.secureAlternatives.map((alt, idx) => (
                <div key={idx} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-error text-sm mt-0.5">block</span>
                    <span className="text-sm font-medium text-on-surface line-through decoration-error/50">{alt.unsafe}</span>
                  </div>
                  <div className="flex justify-center">
                    <span className="material-symbols-outlined text-outline">arrow_downward</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                    <span className="text-sm font-medium text-on-surface">{alt.secure}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 14. CODE REVIEW QUESTIONS */}
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">rule</span>
            14. Code Review Questions
          </h2>
          <div className="bg-surface-container p-5 rounded-xl border border-outline-variant">
            <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
              {guide.codeReviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        </section>

        {/* RELATED SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-outline-variant">
          <section>
            <h3 className="text-sm font-bold text-outline uppercase tracking-wider mb-3">15. Related Findings</h3>
            <div className="space-y-2 mb-4">
              {guide.relatedFindings.map((finding, idx) => (
                <div key={idx} className="text-sm font-medium text-on-surface flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {finding}
                </div>
              ))}
            </div>
            <Link to="/findings" className="inline-block px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors text-primary">
              View Related Findings
            </Link>
          </section>
          <section>
            <h3 className="text-sm font-bold text-outline uppercase tracking-wider mb-3">16. Recommendations</h3>
            <p className="text-sm text-on-surface-variant mb-4">Explore automated recommendations to remediate this vulnerability class across the entire codebase.</p>
            <Link to="/recommendations" className="inline-block px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors text-primary">
              View Recommendations
            </Link>
          </section>
          <section>
            <h3 className="text-sm font-bold text-outline uppercase tracking-wider mb-3">17. Security Rules</h3>
            <div className="space-y-3 mb-4">
              {guide.relatedRules.map((rule, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-lg border border-outline-variant">
                  <div className="text-xs text-outline mb-1 font-mono">{rule.id}</div>
                  <div className="text-sm font-medium text-on-surface">{rule.name}</div>
                  <div className="text-xs text-primary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">scanner</span> {rule.scanner}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/security-rules" className="inline-block px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-colors text-primary">
              View Security Rules
            </Link>
          </section>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-outline-variant pb-6">
        <div className="max-w-3xl">
          <h1 className="text-headline-lg font-bold text-on-surface mb-2">Secure Coding Guide</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Learn how to identify, prevent, and remediate common security vulnerabilities using secure coding practices.
          </p>
        </div>
      </div>

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-surface-container-low p-6 rounded-xl border border-outline-variant">
          <h2 className="text-xl font-bold text-on-surface mb-3">What is Secure Coding?</h2>
          <p className="text-on-surface-variant mb-4 leading-relaxed">
            Secure coding is the practice of designing and writing software to reduce vulnerabilities, protect sensitive data, validate untrusted input, enforce authorization, and follow secure development practices. 
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/50">
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">Why Secure Coding Matters</h3>
              <ul className="list-disc pl-5 text-sm text-on-surface-variant space-y-1">
                <li>Prevent vulnerabilities before deployment</li>
                <li>Reduce security defects</li>
                <li>Protect sensitive information</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2 opacity-0 select-none">Spacer</h3>
              <ul className="list-disc pl-5 text-sm text-on-surface-variant space-y-1">
                <li>Reduce attack surface</li>
                <li>Improve application reliability</li>
                <li>Support secure SDLC practices</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">school</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-on-surface">{guides.length}</div>
              <div className="text-xs text-outline uppercase tracking-wider font-semibold">Topics Available</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-4xl text-secondary">bookmark</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-on-surface">{bookmarks.length}</div>
              <div className="text-xs text-outline uppercase tracking-wider font-semibold">Saved Guides</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            className="w-full h-11 pl-10 pr-4 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors shadow-sm"
            placeholder="Search security topics, vulnerabilities, CWE, OWASP..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select className="h-11 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary min-w-[140px]" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}>
          <option value="">All Languages</option>
          <option value="Python">Python</option>
          <option value="JavaScript">JavaScript</option>
          <option value="TypeScript">TypeScript</option>
          <option value="Java">Java</option>
        </select>
        
        <select className="h-11 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary min-w-[140px] max-w-[200px] truncate" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {SECURE_CODING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="h-11 px-3 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface outline-none focus:border-primary min-w-[140px]" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-b border-outline-variant pb-4">
        <div className="flex flex-wrap gap-4">
          <select className="h-9 px-2 text-xs bg-surface-container border border-outline-variant rounded text-on-surface outline-none focus:border-primary" value={cweFilter} onChange={e => setCweFilter(e.target.value)}>
            <option value="">All CWE</option>
            {cweOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="h-9 px-2 text-xs bg-surface-container border border-outline-variant rounded text-on-surface outline-none focus:border-primary max-w-[150px] truncate" value={owaspFilter} onChange={e => setOwaspFilter(e.target.value)}>
            <option value="">All OWASP</option>
            {owaspOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={clearFilters} className="h-9 px-3 text-xs text-primary hover:underline font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">clear_all</span> Clear Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline font-semibold uppercase tracking-wider">Sort By:</span>
          <select className="h-9 px-2 text-xs bg-transparent border-none text-on-surface font-semibold outline-none focus:ring-0 cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="Relevant">Most Relevant</option>
            <option value="Recent">Recently Updated</option>
            <option value="Alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* LIST OF GUIDES */}
      {filteredGuides.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">search_off</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No security topics found.</h3>
          <p className="text-on-surface-variant max-w-sm mt-2">Try searching for a vulnerability, CWE, OWASP category, or programming language.</p>
          <button onClick={clearFilters} className="mt-6 px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim transition-colors">Clear All Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map(guide => {
            const isBookmarked = bookmarks.includes(guide.id);
            return (
              <div 
                key={guide.id} 
                className="group flex flex-col bg-surface-container-low border border-outline-variant hover:border-primary/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer h-full relative"
                onClick={() => setSearchParams({ guide: guide.id })}
              >
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={(e) => toggleBookmark(guide.id, e)}
                    className="p-1.5 bg-surface-container-high/80 backdrop-blur rounded-full text-on-surface hover:text-primary transition-colors shadow-sm"
                  >
                    <span className={`material-symbols-outlined text-sm ${isBookmarked ? 'text-primary' : ''}`} style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
                  </button>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 pr-8">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      guide.severity === 'Critical' ? 'bg-error text-white' : 
                      guide.severity === 'High' ? 'bg-[#f97316] text-white' :
                      guide.severity === 'Medium' ? 'bg-[#eab308] text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {guide.severity}
                    </span>
                    <span className="text-[10px] font-mono text-secondary font-semibold bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20">{guide.cwe}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">{guide.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-4 line-clamp-3 flex-1">{guide.summary}</p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-4 border-t border-outline-variant/50">
                    <div className="text-xs text-outline font-semibold truncate max-w-[150px]">{guide.category}</div>
                    <div className="flex -space-x-1">
                      {guide.languages.map((lang, idx) => (
                        <div key={lang} className="w-6 h-6 rounded-full bg-surface-container-high border-2 border-surface-container-low flex items-center justify-center text-[10px] font-bold text-on-surface" title={lang} style={{ zIndex: 10 - idx }}>
                          {lang.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SecureCodingGuide;
