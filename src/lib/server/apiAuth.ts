import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

export type ApiUserProfile = {
  id: string;
  role: string;
  agency_id?: string | null;
  email?: string | null;
};

const HQ_ROLES = new Set(['ADMIN', 'HQ_ADMIN']);
const AGENCY_ROLES = new Set(['AGENCY', 'DEALER_ADMIN', 'DEALER_OWNER', 'DEALER_STAFF']);

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

export async function getApiUserProfile(request: NextRequest): Promise<ApiUserProfile | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return null;

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile) return null;
  return profile as ApiUserProfile;
}

export function isHqRole(role?: string | null) {
  return Boolean(role && HQ_ROLES.has(role));
}

export function isAgencyRole(role?: string | null) {
  return Boolean(role && AGENCY_ROLES.has(role));
}
