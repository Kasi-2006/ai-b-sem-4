
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aezbkwdefdkdlhggioqz.supabase.co';
// Note: In a real app, this key would be in an environment variable.
// Since the prompt specifies to use the anon key only, we expect it to be provided or injected.
const SUPABASE_ANON_KEY = (process.env.API_KEY || 'your-anon-key-here');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
