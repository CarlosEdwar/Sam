'use server';

import { createClient, getUserContext } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchShifts() {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('start_time');

  if (error) throw new Error(error.message);

  return data;
}

export async function createShift(shift: any) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shifts')
    .insert({
      ...shift,
      restaurant_id: profile.restaurant_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/shifts');
  return data;
}

export async function updateShift(id: string, shift: any) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from('shifts')
    .update(shift)
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/shifts');
  return { success: true };
}

export async function deleteShift(id: string) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/shifts');
  return { success: true };
}
