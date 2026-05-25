'use server';

import { createClient, getUserContext } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchPrintJobs() {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}

export async function createPrintJob(job: any) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('print_jobs')
    .insert({
      ...job,
      restaurant_id: profile.restaurant_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/history');
  return data;
}
