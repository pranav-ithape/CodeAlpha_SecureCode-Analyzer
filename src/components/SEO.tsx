import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  robots?: string;
  jsonLd?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogImage = '/logo.png',
  robots = 'index,follow',
  jsonLd
}) => {
  useEffect(() => {
    const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://securecodeauditor.com';
    const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;
    const imageUrl = `${siteUrl}${ogImage}`;

    // Update Title
    if (title) document.title = title;

    // Helper to update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (property) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (description) {
      updateMeta('description', description);
      updateMeta('og:description', description, true);
      updateMeta('twitter:description', description);
    }

    if (title) {
      updateMeta('og:title', title, true);
      updateMeta('twitter:title', title);
    }

    updateMeta('robots', robots);
    updateMeta('og:url', canonicalUrl, true);
    updateMeta('og:image', imageUrl, true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:site_name', 'SecureCode Auditor', true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:image', imageUrl);

    // Update Canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update JSON-LD
    let script = document.querySelector('#seo-jsonld');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('id', 'seo-jsonld');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

  }, [title, description, canonical, ogImage, robots, jsonLd]);

  return null;
};

export default SEO;
