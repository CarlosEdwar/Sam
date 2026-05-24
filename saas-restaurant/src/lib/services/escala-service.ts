'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isMonday, isSunday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Employee {
  id: string;
  name: string;
  sector: 'administrativo' | 'bar' | 'cozinha' | 'salao';
  shift: 'manha' | 'tarde' | 'flexivel';
}

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  sector: string;
}

/**
 * Gera escala automática para um mês específico
 * Regras:
 * - Folga fixa toda segunda-feira
 * - 1 domingo de folga por mês com rodízio
 * - Turnos: 07:00-15:00 (manhã) ou 15:00-23:00 (tarde)
 */
export async function generateSchedule(month: number, year: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Apenas administradores podem gerar escalas');
  }

  // Buscar funcionários do restaurante
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id);

  if (!employees || employees.length === 0) {
    throw new Error('Nenhum funcionário cadastrado');
  }

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const schedule = [];
  const sundayRotation: Record<string, number> = {}; // Controle de rodízio de domingos

  for (const day of days) {
    const dayOfWeek = format(day, 'EEEE', { locale: ptBR });
    const isMondayDay = isMonday(day);
    const isSundayDay = isSunday(day);

    for (const employee of employees) {
      // Funcionários administrativos não seguem regra de turnos
      if (employee.sector === 'administrativo') {
        schedule.push({
          date: format(day, 'yyyy-MM-dd'),
          employee_id: employee.id,
          employee_name: employee.name,
          sector: employee.sector,
          shift: 'comercial',
          start_time: '08:00',
          end_time: '17:00',
          is_day_off: false,
          observation: '',
        });
        continue;
      }

      // Regra: Folga toda segunda-feira
      if (isMondayDay) {
        schedule.push({
          date: format(day, 'yyyy-MM-dd'),
          employee_id: employee.id,
          employee_name: employee.name,
          sector: employee.sector,
          shift: employee.shift,
          start_time: '--:--',
          end_time: '--:--',
          is_day_off: true,
          observation: 'Folga semanal (Segunda-feira)',
        });
        continue;
      }

      // Regra: 1 domingo de folga por mês com rodízio
      if (isSundayDay) {
        if (!sundayRotation[employee.id]) {
          sundayRotation[employee.id] = 0;
        }

        // Verifica se já teve folga neste mês
        const hasOffThisMonth = schedule.some(
          s => s.employee_id === employee.id && 
               s.is_day_off && 
               s.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
        );

        if (!hasOffThisMonth && sundayRotation[employee.id] === 0) {
          // Primeira folga de domingo do mês
          schedule.push({
            date: format(day, 'yyyy-MM-dd'),
            employee_id: employee.id,
            employee_name: employee.name,
            sector: employee.sector,
            shift: employee.shift,
            start_time: '--:--',
            end_time: '--:--',
            is_day_off: true,
            observation: 'Folga mensal (Domingo)',
          });
          sundayRotation[employee.id] = 1;
          continue;
        }
      }

      // Atribuir turno normal
      const startTime = employee.shift === 'manha' ? '07:00' : '15:00';
      const endTime = employee.shift === 'manha' ? '15:00' : '23:00';

      schedule.push({
        date: format(day, 'yyyy-MM-dd'),
        employee_id: employee.id,
        employee_name: employee.name,
        sector: employee.sector,
        shift: employee.shift,
        start_time: startTime,
        end_time: endTime,
        is_day_off: false,
        observation: '',
      });
    }
  }

  // Salvar no banco
  for (const entry of schedule) {
    // Primeiro criar o turno se não existir
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('id')
      .eq('date', entry.date)
      .eq('sector', entry.sector)
      .eq('restaurant_id', profile.restaurant_id)
      .single();

    let shiftId = shiftData?.id;

    if (!shiftId) {
      const { data: newShift } = await supabase
        .from('shifts')
        .insert({
          date: entry.date,
          start_time: entry.start_time,
          end_time: entry.end_time,
          sector: entry.sector,
          restaurant_id: profile.restaurant_id,
        })
        .select('id')
        .single();
      
      shiftId = newShift?.id;
    }

    // Criar atribuição
    if (shiftId) {
      await supabase
        .from('schedule_assignments')
        .insert({
          shift_id: shiftId,
          employee_id: entry.employee_id,
          observation: entry.observation,
          restaurant_id: profile.restaurant_id,
        });
    }
  }

  revalidatePath('/dashboard/escalas');
  return { success: true, count: schedule.length };
}

export async function getSchedule(month: number, year: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single();

  const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('schedule_assignments')
    .select(`
      *,
      shifts (date, start_time, end_time, sector),
      employees (name, sector, shift)
    `)
    .gte('shifts.date', startDate)
    .lte('shifts.date', endDate)
    .eq('restaurant_id', profile.restaurant_id)
    .order('shifts.date');

  if (error) throw new Error(error.message);

  return data;
}

export async function updateScheduleObservation(assignmentId: string, observation: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  const { error } = await supabase
    .from('schedule_assignments')
    .update({ observation })
    .eq('id', assignmentId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/escalas');
  return { success: true };
}
