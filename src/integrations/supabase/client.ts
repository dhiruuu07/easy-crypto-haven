// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qoqikhedjsprqftokeuw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWlraGVkanNwcnFmdG9rZXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNDQ3ODQsImV4cCI6MjA1NDYyMDc4NH0.N39JFt5nRwKuGbaVIloSvpqY0DRB3jmRpvHXJURgGy4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);