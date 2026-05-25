'use server';

import { createClient, getUserContext } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchSettings() {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function saveAppConfig(config: any) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from('settings')
    .update({ app_config: config })
    .eq('restaurant_id', profile.restaurant_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function saveSystemPrefs(prefs: any) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from('settings')
    .update({ system_prefs: prefs })
    .eq('restaurant_id', profile.restaurant_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/settings');
  return { success: true };
}
