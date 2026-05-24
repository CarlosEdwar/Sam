/**
 * Centralized API client for SamLabel.
 * All requests are authenticated via X-Clerk-User-Id header.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  json?: unknown;
  tenantId?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  userId: string,
  options: FetchOptions = {}
): Promise<T> {
  const { json, tenantId, ...rest } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Clerk-User-Id': userId,
    ...(tenantId ? { 'X-Clerk-Tenant-Id': tenantId } : {}),
    ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    throw new ApiError(res.status, `HTTP ${res.status} – ${path}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export interface AppConfig {
  labelFormat: string;
  defaultPrinter: string;
  autoPrint: boolean;
  copies: number;
}

export interface SystemPrefs {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  printerName: string | null;
}

export interface UserSettings {
  app_config: AppConfig;
  system_prefs: SystemPrefs;
}

export function fetchSettings(userId: string): Promise<UserSettings> {
  return apiFetch<UserSettings>('/settings', userId);
}

export function saveAppConfig(userId: string, config: Partial<AppConfig>) {
  return apiFetch<UserSettings>('/settings', userId, {
    method: 'PUT',
    json: { app_config: config },
  });
}

export function saveSystemPrefs(userId: string, prefs: Partial<SystemPrefs>) {
  return apiFetch<UserSettings>('/settings', userId, {
    method: 'PUT',
    json: { system_prefs: prefs },
  });
}

// ─── Print Jobs ────────────────────────────────────────────────────────────

export interface PrintJob {
  id: string;
  jobId: string;
  productName: string;
  sku: string;
  quantity: number;
  status: 'success' | 'failed' | 'pending';
  operator: string;
  printer: string;
  method: string;
  created_at: string;
}

export function fetchPrintJobs(userId: string): Promise<PrintJob[]> {
  return apiFetch<PrintJob[]>('/print-jobs', userId);
}

export function createPrintJob(
  userId: string,
  job: Omit<PrintJob, 'id' | 'created_at'>
): Promise<PrintJob> {
  return apiFetch<PrintJob>('/print-jobs', userId, {
    method: 'POST',
    json: job,
  });
}

// ─── Scale Assistant ─────────────────────────────────────────────────────────

export function fetchEmployees(userId: string): Promise<Employee[]> {
  return apiFetch<Employee[]>('/employees', userId);
}

export function createEmployee(userId: string, employee: Omit<Employee, 'id'>) {
  return apiFetch<Employee>('/employees', userId, {
    method: 'POST',
    json: employee,
  });
}

export function updateEmployee(userId: string, id: string, employee: Partial<Employee>) {
  return apiFetch<Employee>(`/employees/${id}`, userId, {
    method: 'PUT',
    json: employee,
  });
}

export function deleteEmployee(userId: string, id: string) {
  return apiFetch<void>(`/employees/${id}`, userId, {
    method: 'DELETE',
  });
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  sector?: string;
  day_off?: number | null;
}

export function fetchShifts(userId: string): Promise<Shift[]> {
  return apiFetch<Shift[]>('/shifts', userId);
}

export function createShift(userId: string, shift: Omit<Shift, 'id'>) {
  return apiFetch<Shift>('/shifts', userId, {
    method: 'POST',
    json: shift,
  });
}

export function updateShift(userId: string, id: string, shift: Partial<Shift>) {
  return apiFetch<Shift>(`/shifts/${id}`, userId, {
    method: 'PUT',
    json: shift,
  });
}

export function deleteShift(userId: string, id: string) {
  return apiFetch<void>(`/shifts/${id}`, userId, {
    method: 'DELETE',
  });
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
}

export interface ScaleAssignment {
  employee_id: string;
  shift_id: string;
  date: string;
}

export interface ScheduleItem {
  id: string;
  employee_id: string;
  shift_id: string;
  date: string;
}

export interface ScaleDay {
  date: string;
  schedules: ScheduleItem[];
}

export interface ScaleData {
  employees: Employee[];
  shifts: Shift[];
  assignments: ScaleAssignment[];
  days: ScaleDay[];
}

export async function fetchScales(userId: string, tenantId?: string): Promise<ScaleData> {
  const data = await apiFetch<ScaleData>('/escalas', userId, { tenantId });

  // Transform data if days are missing (compatibility with refactored page)
  if (!data.days) {
    const daysMap: Record<string, ScheduleItem[]> = {};
    data.assignments.forEach(as => {
      if (!daysMap[as.date]) daysMap[as.date] = [];
      daysMap[as.date].push({
        id: (as as any).id || `${as.employee_id}-${as.date}`,
        ...as
      });
    });

    data.days = Object.entries(daysMap).map(([date, schedules]) => ({
      date,
      schedules
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  return data;
}

export function generateSchedules(userId: string, tenantId?: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/escalas/gerar', userId, {
    method: 'POST',
    tenantId,
  });
}

export function updateShiftAssignment(
  userId: string,
  assignment: ScaleAssignment,
  tenantId?: string
): Promise<ScaleAssignment> {
  return apiFetch<ScaleAssignment>('/escalas', userId, {
    method: 'PATCH',
    json: assignment,
    tenantId,
  });
}

export function updateEmployeeDayOff(
  userId: string,
  employeeId: string,
  dayOff: number,
  tenantId?: string
): Promise<Employee> {
  return apiFetch<Employee>('/escalas/employee/day-off', userId, {
    method: 'PATCH',
    json: { employee_id: employeeId, day_off: dayOff },
    tenantId,
  });
}

export function updateSchedule(userId: string, data: ScaleData, tenantId?: string): Promise<ScaleData> {
  return apiFetch<ScaleData>('/escalas', userId, {
    method: 'PUT',
    json: data,
    tenantId,
  });
}

export function exportScalePdf(userId: string): Promise<void> {
  const url = `${API_URL}/escalas/export/pdf`;
  window.open(url, '_blank');
  return Promise.resolve();
}