import { z } from 'zod';

// Schema para autenticação
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Schema para funcionário
export const employeeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['admin', 'user']),
  sector: z.enum(['administrativo', 'bar', 'cozinha', 'salao']),
  shift: z.enum(['manha', 'tarde', 'flexivel']).optional(),
  restaurant_id: z.string().uuid(),
});

// Schema para turno
export const shiftSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  sector: z.enum(['administrativo', 'bar', 'cozinha', 'salao']),
  restaurant_id: z.string().uuid(),
});

// Schema para atribuição de escala
export const scheduleAssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  shift_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  observation: z.string().optional(),
  restaurant_id: z.string().uuid(),
});

// Schema para produto
export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  stock_qty: z.number().int().nonnegative('Quantidade não pode ser negativa'),
  restaurant_id: z.string().uuid(),
});

// Tipos exportados
export type LoginInput = z.infer<typeof loginSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type ScheduleAssignment = z.infer<typeof scheduleAssignmentSchema>;
export type Product = z.infer<typeof productSchema>;
