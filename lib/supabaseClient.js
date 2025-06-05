import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rejhbsmfcueudfbhadgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlamhic21mY3VldWRmYmhhZGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NjA3NzYsImV4cCI6MjA2NDUzNjc3Nn0.6S8CqB_4JBcg8hW0L1iGAi1P2_46k6CTyeCgfwjX8Z4';

// Use a public CORS proxy instead of PHP proxy
const proxyFetch = (url, options) => {
  // Make sure we're using the full URL with the proxy
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  
  console.log('Proxying request to:', proxyUrl);
  
  return fetch(proxyUrl, {
    ...options,
    headers: {
      ...options.headers,
      // Make sure we keep the original headers
    }
  });
};

// Create Supabase client with custom fetch
export const supabase = createClient(
  SUPABASE_URL, 
  SUPABASE_KEY,
  {
    global: {
      fetch: proxyFetch
    }
  }
);