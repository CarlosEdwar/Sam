'use server';

import { createClient, getUserContext } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchEmployees() {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('name');

  if (error) throw new Error(error.message);

  return data;
}

export async function createEmployee(employee: {
  name: string;
  role: string;
  department: string;
  day_off: number | null;
}) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employees')
    .insert({
      ...employee,
      restaurant_id: profile.restaurant_id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/employees');
  return data;
}

export async function updateEmployee(id: string, employee: Partial<{
  name: string;
  role: string;
  department: string;
  day_off: number | null;
}>) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('employees')
    .update(employee)
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/employees');
  return data;
}

export async function deleteEmployee(id: string) {
  const { profile } = await getUserContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/employees');
  return { success: true };
}
