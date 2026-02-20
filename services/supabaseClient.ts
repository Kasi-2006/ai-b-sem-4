
import { createClient } from '@supabase/supabase-js';

// These credentials should be verified if the connection persists in "Setup Required"
const SUPABASE_URL = 'https://aezbkwdefdkdlhggioqz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5baCIsBROz4ZpmOQBFMJow_7SlRF6xX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const checkSupabaseConnection = async () => {
  // Check if user has manually bypassed setup before
  const isManuallyConfirmed = localStorage.getItem('supabase_setup_confirmed') === 'true';

  try {
    console.log("Checking Supabase Infrastructure...");
    
    // 1. Check Tables - This is the most reliable way to check if the schema is deployed.
    const { error: tableError } = await supabase
      .from('subjects')
      .select('count', { count: 'exact', head: true });
    
    // Logic for "Needs Setup" based on table presence
    if (tableError) {
      console.error("Supabase Table Check Result:", tableError);
      
      // If the user previously confirmed setup, we ignore missing table errors and try to proceed
      if (isManuallyConfirmed) {
        return { connected: true, needsSetup: false };
      }

      // 42P01 is Postgres for "table does not exist"
      const isMissingTable = 
        tableError.code === '42P01' || 
        tableError.code === 'PGRST116' ||
        tableError.message?.toLowerCase().includes('does not exist') ||
        tableError.message?.toLowerCase().includes('could not find');
      
      if (isMissingTable) {
        return { connected: true, needsSetup: true };
      }

      // Check for Auth/Key issues
      const status = (tableError as any).status;
      const isAuthError = status === 401 || status === 403 || tableError.message?.includes('JWT');
      if (isAuthError) {
        return { connected: false, error: 'Auth Error: Check your Supabase URL and Anon Key.' };
      }

      return { connected: false, error: tableError.message };
    }

    // If check passes, ensure flag is set for next time
    localStorage.setItem('supabase_setup_confirmed', 'true');
    return { connected: true, needsSetup: false };
  } catch (err: any) {
    console.error("Fatal Connection Check Error:", err);
    // If we have a previous confirmation, ignore fatal errors and let the user try the dashboard
    if (isManuallyConfirmed) return { connected: true, needsSetup: false };
    return { connected: false, error: err.message };
  }
};
