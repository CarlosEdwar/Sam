"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Employee, Shift, ScaleAssignment, ScaleData } from "@/lib/api";
import { updateShiftAssignment, updateEmployeeDayOff } from "@/lib/api";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Briefcase,
} from "lucide-react";

// ───────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────

interface ScaleMatrixProps {
  userId: string;
  tenantId?: string;
  data: ScaleData;
  onRefresh: () => void;
  isEditMode?: boolean;
  onDragStart?: (item: any) => void;
  onDragOver?: (e: any, dayIndex: number, scheduleIndex: number) => void;
  onDragEnd?: () => void;
  draggedItem?: any;
}

interface DayInfo {
  dateString: string;
  dayNumber: number;
  dayName: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ...
  isWeekend: boolean;
  isMonday: boolean;
  isSunday: boolean;
}

// ───────────────────────────────────────────────
// Sector config
// ───────────────────────────────────────────────

const SECTOR_ORDER = ["admin", "bar", "kitchen", "hall"];

const SECTOR_LABELS: Record<string, string> = {
  admin: "Administrativo",
  bar: "Bar",
  kitchen: "Cozinha",
  hall: "Salão",
  other: "Outros",
};

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  admin: <Briefcase size={14} />,
  bar: <Coffee size={14} />,
  kitchen: <Sun size={14} />,
  hall: <Moon size={14} />,
  other: <Briefcase size={14} />,
};

const SECTOR_COLORS: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  bar: "bg-amber-50 text-amber-700 border-amber-200",
  kitchen: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hall: "bg-sky-50 text-sky-700 border-sky-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const OPERATIONAL_SECTORS = ["bar", "kitchen", "hall"];

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

function getShiftLabel(shift: Shift): string {
  const s = shift.start_time?.slice(0, 5);
  const e = shift.end_time?.slice(0, 5);
  if (s === "07:00" && e === "15:00") return "T1";
  if (s === "15:00" && e === "23:00") return "T2";
  if (shift.name?.toLowerCase().includes("manhã")) return "T1";
  if (shift.name?.toLowerCase().includes("tarde")) return "T2";
  if (shift.name?.toLowerCase().includes("noite")) return "T2";
  if (shift.name?.toLowerCase().includes("admin")) return "ADM";
  return shift.name?.slice(0, 3).toUpperCase() || "—";
}

function getShiftCellStyle(shift: Shift | null, isDayOff: boolean): string {
  if (isDayOff) {
    return "bg-red-50 text-red-600 font-bold";
  }
  if (!shift) {
    return "bg-slate-50/50 text-slate-300";
  }

  const s = shift.start_time?.slice(0, 5);
  if (s === "07:00") return "bg-emerald-100 text-emerald-800 font-semibold";
  if (s === "15:00") return "bg-indigo-100 text-indigo-800 font-semibold";
  return "bg-blue-50 text-blue-700 font-semibold";
}

function normalizeSector(sector?: string | null): string {
  if (!sector) return "other";
  const s = sector.toLowerCase().trim();
  if (s.includes("admin") || s.includes("administrativo")) return "admin";
  if (s.includes("bar")) return "bar";
  if (s.includes("cozinha") || s.includes("kitchen")) return "kitchen";
  if (s.includes("salão") || s.includes("salao") || s.includes("hall")) return "hall";
  return "other";
}

// ───────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────

export default function ScaleMatrix({
  userId,
  tenantId,
  data,
  onRefresh,
  isEditMode,
}: ScaleMatrixProps) {
  const { employees, shifts, assignments } = data;
  const [scale, setScale] = useState<ScaleAssignment[]>(assignments);
  const [mounted, setMounted] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    employeeId: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    setScale(assignments);
  }, [assignments]);

  // ─── Month days calculation ───
  const days: DayInfo[] = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result: DayInfo[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dow = date.getDay();
      result.push({
        dateString: date.toISOString().split("T")[0],
        dayNumber: i,
        dayName: date
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .replace(".", ""),
        dayOfWeek: dow,
        isWeekend: dow === 0 || dow === 6,
        isMonday: dow === 1,
        isSunday: dow === 0,
      });
    }
    return result;
  }, []);

  // ─── Group employees by sector ───
  const groupedEmployees = useMemo(() => {
    const groups: Record<string, Employee[]> = {};

    employees.forEach((emp) => {
      const sector = normalizeSector((emp as any).sector || (emp as any).department);
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(emp);
    });

    // Sort by defined order, then alphabetically within each sector
    const ordered: { sector: string; employees: Employee[] }[] = [];
    const allSectors = [...new Set([...SECTOR_ORDER, ...Object.keys(groups)])];

    allSectors.forEach((sector) => {
      if (groups[sector] && groups[sector].length > 0) {
        ordered.push({
          sector,
          employees: groups[sector].sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    });

    return ordered;
  }, [employees]);

  // ─── Lookup helpers ───
  const getAssignment = (employeeId: string, dateString: string) => {
    return scale.find(
      (a) => a.employee_id === employeeId && a.date === dateString
    );
  };

  const getShift = (shiftId: string) => {
    return shifts.find((s) => s.id === shiftId) || null;
  };

  const isDayOff = (employee: Employee, day: DayInfo): boolean => {
    const sector = normalizeSector((employee as any).sector || (employee as any).department);

    // Fixed Monday off for operational sectors
    if (OPERATIONAL_SECTORS.includes(sector) && day.isMonday) {
      return true;
    }

    // Employee-specific day off
    if (
      employee.day_off !== null &&
      employee.day_off !== undefined &&
      day.dayOfWeek === employee.day_off
    ) {
      return true;
    }

    return false;
  };

  // ─── Actions ───
  const handleCellClick = (employeeId: string, dateString: string) => {
    if (!isEditMode) return;
    setActiveCell({ employeeId, date: dateString });
  };

  const handleAssignShift = async (shiftId: string) => {
    if (!activeCell) return;
    try {
      await updateShiftAssignment(
        userId,
        {
          employee_id: activeCell.employeeId,
          shift_id: shiftId,
          date: activeCell.date,
        },
        tenantId
      );
      toast.success("Turno atribuído com sucesso");
      onRefresh();
      setActiveCell(null);
    } catch (error) {
      toast.error("Erro ao atribuir turno");
    }
  };

  // ─── Current month label ───
  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now
      .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          📅 Escala de {currentMonthLabel}
        </h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
            T1 (07h–15h)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
            T2 (15h–23h)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-blue-50 border border-blue-200" />
            ADM
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-300" />
            FOLGA
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="border-collapse min-w-full text-[11px]">
          {/* Header: Day numbers */}
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th
                className="sticky left-0 z-20 p-3 text-left border-b border-r bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold text-xs min-w-[180px]"
              >
                Colaborador
              </th>
              <th
                className="sticky left-[180px] z-20 p-2 text-center border-b border-r bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold text-xs min-w-[70px]"
              >
                Setor
              </th>
              {days.map((day) => (
                <th
                  key={day.dateString}
                  className={`p-1.5 text-center border-b border-l border-slate-200 dark:border-slate-700 font-medium min-w-[38px] ${
                    day.isMonday
                      ? "bg-red-50/60 dark:bg-red-900/20"
                      : day.isWeekend
                      ? "bg-slate-100/70 dark:bg-slate-800/80"
                      : ""
                  }`}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span
                      className={`text-[9px] uppercase tracking-wider ${
                        day.isMonday
                          ? "text-red-400 font-bold"
                          : day.isSunday
                          ? "text-orange-400 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        day.isMonday
                          ? "text-red-500"
                          : day.isSunday
                          ? "text-orange-500"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groupedEmployees.map(({ sector, employees: sectorEmps }) => (
              <React.Fragment key={sector}>
                {/* Sector Header Row */}
                <tr>
                  <td
                    colSpan={days.length + 2}
                    className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-b border-t ${SECTOR_COLORS[sector] || SECTOR_COLORS.other}`}
                  >
                    <div className="flex items-center gap-2">
                      {SECTOR_ICONS[sector] || SECTOR_ICONS.other}
                      {SECTOR_LABELS[sector] || sector}
                      <span className="text-[10px] font-normal opacity-70 ml-1">
                        ({sectorEmps.length} colaborador{sectorEmps.length !== 1 ? "es" : ""})
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Employee Rows */}
                {sectorEmps.map((employee) => (
                  <tr
                    key={employee.id}
                    className="group hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Employee Name */}
                    <td className="sticky left-0 z-10 p-2.5 border-b border-r bg-white dark:bg-slate-900 dark:border-slate-700 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] group-hover:bg-blue-50/30 transition-colors min-w-[180px]">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block">
                        {employee.name}
                      </span>
                    </td>

                    {/* Sector Badge */}
                    <td className="sticky left-[180px] z-10 p-1.5 border-b border-r bg-white dark:bg-slate-900 dark:border-slate-700 group-hover:bg-blue-50/30 transition-colors text-center min-w-[70px]">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          SECTOR_COLORS[sector] || SECTOR_COLORS.other
                        }`}
                      >
                        {SECTOR_LABELS[sector]?.slice(0, 3) || "OUT"}
                      </span>
                    </td>

                    {/* Day Cells */}
                    {days.map((day) => {
                      const dayOff = isDayOff(employee, day);
                      const assignment = getAssignment(employee.id, day.dateString);
                      const shift = assignment ? getShift(assignment.shift_id) : null;
                      const cellStyle = getShiftCellStyle(shift, dayOff);

                      return (
                        <td
                          key={`${employee.id}-${day.dateString}`}
                          className={`p-0.5 border-b border-l border-slate-100 dark:border-slate-800 text-center ${
                            day.isMonday && OPERATIONAL_SECTORS.includes(sector)
                              ? "bg-red-50/40"
                              : ""
                          }`}
                          onClick={() => handleCellClick(employee.id, day.dateString)}
                        >
                          <div
                            className={`flex items-center justify-center rounded h-8 w-full text-[10px] transition-all ${cellStyle} ${
                              isEditMode
                                ? "cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1"
                                : ""
                            }`}
                            title={
                              dayOff
                                ? "FOLGA"
                                : shift
                                ? `${shift.name} (${shift.start_time?.slice(0,5)}–${shift.end_time?.slice(0,5)})`
                                : "Sem turno"
                            }
                          >
                            {dayOff ? (
                              <span className="font-bold text-[9px]">F</span>
                            ) : shift ? (
                              <span>{getShiftLabel(shift)}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shift Assignment Modal */}
      {activeCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm"
          onClick={() => setActiveCell(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-80 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 text-center">
              Atribuir Turno
            </h3>
            <p className="text-[10px] text-slate-400 mb-4 text-center">
              {employees.find((e) => e.id === activeCell.employeeId)?.name} —{" "}
              {new Date(activeCell.date + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {shifts.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => handleAssignShift(shift.id)}
                  className={`p-3 rounded-lg text-sm font-medium text-left transition-all hover:scale-[1.02] hover:shadow-md ${getShiftCellStyle(shift, false)} border border-transparent hover:border-slate-300`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{getShiftLabel(shift)}</span>
                    <span className="text-[10px] opacity-70">
                      {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-60">{shift.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveCell(null)}
              className="w-full mt-4 p-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
