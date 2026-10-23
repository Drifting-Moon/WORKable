import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    typeof supabaseAnonKey === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Sign up a new user with Supabase Auth.
 * Includes user metadata (name, role, company) so trigger or client can store it.
 */
export async function signUpWithSupabase({ name, email, password, role, company }) {
  if (!supabase) throw new Error('Supabase is not configured. Please add your credentials to .env');

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name.trim(),
        role: role || 'seeker',
        company: role === 'employer' ? (company || '').trim() : undefined,
      },
    },
  });

  if (error) throw error;

  // If user was created, also attempt to upsert to public.profiles if table exists
  if (data?.user) {
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || 'seeker',
        company: role === 'employer' ? (company || '').trim() : null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // If table isn't created yet or trigger handles it, metadata is already safe
    }
  }

  return data;
}

/**
 * Sign in existing user with email and password.
 */
export async function signInWithSupabase(email, password) {
  if (!supabase) throw new Error('Supabase is not configured. Please add your credentials to .env');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out current user.
 */
export async function signOutWithSupabase() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out of Supabase:', error.message);
}

/**
 * Fetch profile for a given user ID.
 */
export async function fetchUserProfile(userId) {
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Update profile for a given user ID.
 */
export async function updateUserProfile(userId, updates) {
  if (!supabase || !userId) return;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ====================================================================
 * Private Resumes / CV Storage (Buckets + Signed URLs)
 * ==================================================================== */

export async function uploadResumeStorage(userId, file) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const filePath = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

  // 1. Upload to Supabase Storage bucket 'resumes'
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Storage bucket upload error:', uploadError);
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 2. Insert metadata into public.resumes
  const { data: resumeRow, error: dbError } = await supabase
    .from('resumes')
    .insert({
      seeker_id: userId,
      file_name: file.name,
      storage_path: filePath,
      file_size: Math.round(file.size / 1024) + ' KB',
      mime_type: file.type || 'application/pdf',
      is_primary: false,
    })
    .select()
    .single();

  if (dbError) {
    // Avoid leaving an untracked private file behind when its database row fails.
    await supabase.storage.from('resumes').remove([filePath]).catch(() => {});
    throw new Error(`CV uploaded but its database record could not be saved: ${dbError.message}`);
  }
  if (!resumeRow) throw new Error('CV upload completed without a database record.');
  return resumeRow;
}

export async function getSignedResumeUrl(storagePath) {
  if (!supabase || !storagePath) return null;
  // Clean path in case of prefixes
  const cleanPath = storagePath.startsWith('resumes/') ? storagePath.replace(/^resumes\//, '') : storagePath;
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(cleanPath, 3600); // 1-hour expiry

  if (error) {
    console.error('Error creating signed resume URL for path', cleanPath, ':', error.message);
    return null;
  }
  return data?.signedUrl;
}

/* ====================================================================
 * Accessibility Reports (Fraud & Misleading Claims Investigation)
 * ==================================================================== */

export async function submitAccessibilityReportSupabase(report) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('accessibility_reports')
    .insert([report])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAccessibilityReportsSupabase() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('accessibility_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports from Supabase:', error.message);
    return [];
  }
  return data || [];
}

export async function updateAccessibilityReportSupabase(id, updates) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('accessibility_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ====================================================================
 * Accessibility Evidence Declarations
 * ==================================================================== */

export async function fetchEvidenceSupabase(companyId) {
  if (!supabase) return [];

  let query = supabase.from('accessibility_evidence').select('*');
  if (companyId) query = query.eq('company_id', companyId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function submitEvidenceSupabase(evidence) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('accessibility_evidence')
    .insert([evidence])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvidenceSupabase(id, updates) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('accessibility_evidence')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ====================================================================
 * Audit Logs
 * ==================================================================== */

export async function fetchAuditLogsSupabase() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return [];
  return data || [];
}

/* ====================================================================
 * Jobs (Real PostgreSQL)
 * ==================================================================== */

export async function fetchJobsSupabase() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('posted_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs from Supabase:', error.message);
    return [];
  }
  return data || [];
}

export async function createJobSupabase(job) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('jobs')
    .insert([job])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateJobSupabase(jobId, updates) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ====================================================================
 * Applications & Resumes (Real PostgreSQL)
 * ==================================================================== */

export async function fetchApplicationsSupabase() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles:seeker_id (
        id, name, email, role, phone, summary, skills, education, experience, access_prefs, resume_name
      ),
      jobs:job_id (
        id, title, employer_id, company_id, location, type, arrangement
      )
    `)
    .order('applied_at', { ascending: false });

  if (error) {
    console.warn('Falling back to simple applications fetch:', error.message);
    const { data: fallback, error: fbError } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });
    if (fbError) {
      console.error('Error fetching applications from Supabase:', fbError.message);
      return [];
    }
    return fallback || [];
  }
  return data || [];
}

export async function submitApplicationSupabase(app) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('applications')
    .insert([app])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateApplicationStatusSupabase(appId, status) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appId)
    .select()
    .single();

  if (error) {
    console.error('Error updating application status in Supabase:', error.message);
    throw error;
  }
  return data;
}

export async function withdrawApplicationSupabase(appId) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'Withdrawn', updated_at: new Date().toISOString() })
    .eq('id', appId)
    .select()
    .single();

  if (error) {
    console.error('Error withdrawing application in Supabase:', error.message);
    throw error;
  }
  return data;
}

export async function fetchResumesSupabase(seekerId) {
  if (!supabase || !seekerId) return [];

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('seeker_id', seekerId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function deleteResumeSupabase(resumeId) {
  if (!supabase) return;
  const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
  if (error) throw error;
}

/* ====================================================================
 * Saved Jobs / Bookmarks (Real PostgreSQL)
 * ==================================================================== */

export async function fetchSavedJobsSupabase(seekerId) {
  if (!supabase || !seekerId) return [];

  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('seeker_id', seekerId);

  if (error) {
    console.error('Error fetching saved jobs from Supabase:', error.message);
    return [];
  }
  return (data || []).map((row) => row.job_id);
}

export async function toggleSavedJobSupabase(seekerId, jobId) {
  if (!supabase || !seekerId || !jobId) throw new Error('Supabase is not configured.');

  // Check if currently saved
  const { data, error: checkError } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('seeker_id', seekerId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking saved job status:', checkError.message);
  }

  if (data?.job_id) {
    // Unsave
    const { error: delError } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('seeker_id', seekerId)
      .eq('job_id', jobId);
    if (delError) throw delError;
    return false;
  } else {
    // Save
    const { error: insError } = await supabase
      .from('saved_jobs')
      .insert({ seeker_id: seekerId, job_id: jobId });
    if (insError) throw insError;
    return true;
  }
}


