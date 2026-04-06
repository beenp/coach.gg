import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzyzoivorstjfkerbnuq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXpvaXZvcnN0amZrZXJibnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjAxMTUsImV4cCI6MjA5MDgzNjExNX0.QuSxuINFfQnW3goH8QFC80snpd2sLf7ZYEHKbiK1WQQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);