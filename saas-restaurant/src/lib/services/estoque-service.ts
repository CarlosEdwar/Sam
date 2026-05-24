'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  const supabase = await createClient();
  
  // Usuário logado para obter tenant_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  // Buscar perfil para obter restaurant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Perfil não encontrado');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('name');

  if (error) throw new Error(error.message);

  return data;
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single();

  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const stock_qty = parseInt(formData.get('stock_qty') as string);

  const { error } = await supabase
    .from('products')
    .insert({
      name,
      sku,
      stock_qty,
      restaurant_id: profile.restaurant_id,
    });

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/estoque');
  return { success: true };
}

export async function updateStock(productId: string, newQty: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single();

  const { error } = await supabase
    .from('products')
    .update({ stock_qty: newQty })
    .eq('id', productId)
    .eq('restaurant_id', profile.restaurant_id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/estoque');
  return { success: true };
}
