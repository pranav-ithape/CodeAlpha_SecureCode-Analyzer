export const validateScanRequest = (applicationName: any, language: any, sourceCode: any): string | null => {
  if (!applicationName || typeof applicationName !== 'string' || applicationName.trim() === '') {
    return 'Invalid or missing applicationName.';
  }
  
  if (!language || typeof language !== 'string' || language.trim() === '') {
    return 'Invalid or missing language.';
  }
  
  const supportedLanguages = ['python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'php'];
  if (!supportedLanguages.includes(language.toLowerCase())) {
    return `Language '${language}' is not currently supported. Only ${supportedLanguages.join(', ')} are supported.`;
  }
  
  if (!sourceCode || typeof sourceCode !== 'string' || sourceCode.trim() === '') {
    return 'Invalid or missing sourceCode.';
  }
  
  // Reasonable max size check (e.g. 5MB of string length roughly)
  const MAX_SOURCE_LENGTH = 5 * 1024 * 1024;
  if (sourceCode.length > MAX_SOURCE_LENGTH) {
    return 'Source code exceeds maximum allowed length.';
  }
  
  return null;
};
