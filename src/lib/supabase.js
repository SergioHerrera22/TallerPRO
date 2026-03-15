import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ujferflpnlgkwpyobtzz.supabase.co";
const supabaseKey = "sb_publishable_NinziqWVI35gANPV3TmNWg_0QlgWXmd";

export const supabase = createClient(supabaseUrl, supabaseKey);
