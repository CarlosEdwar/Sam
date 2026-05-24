<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ScaleAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ScaleService
{
    /**
     * Validate if a shift assignment is allowed based on business rules.
     *
     * @throws InvalidArgumentException
     */
    public function validateAssignment(string $tenantId, string $employeeId, string $shiftId, string $date, $currentAssignments = null): void
    {
        $employee = Employee::where('tenant_id', $tenantId)->findOrFail($employeeId);
        $shift = Shift::where('tenant_id', $tenantId)->findOrFail($shiftId);
        $assignmentDate = Carbon::parse($date);

        // 0. Multi-Tenancy: Ensure employee and shift belong to the tenant
        if ($employee->tenant_id !== $tenantId || $shift->tenant_id !== $tenantId) {
            throw new InvalidArgumentException("Resource does not belong to the current tenant.");
        }

        // 1. Sector-Specific Rules
        if (in_array($employee->sector, ['bar', 'kitchen', 'hall'])) {
            // Rule: Fixed Monday Off for Operational Sectors
            if ($assignmentDate->dayOfWeek === Carbon::MONDAY) {
                throw new InvalidArgumentException("Operational staff are not allowed to work on Mondays.");
            }

            // Rule: Operational shifts must be either 07:00-15:00 or 15:00-23:00
            $validShifts = [
                ['start' => '07:00', 'end' => '15:00'],
                ['start' => '15:00', 'end' => '23:00'],
            ];
            $isValidShift = false;
            foreach ($validShifts as $valid) {
                if ($shift->start_time === $valid['start'] && $shift->end_time === $valid['end']) {
                    $isValidShift = true;
                    break;
                }
            }
            if (!$isValidShift) {
                throw new InvalidArgumentException("Operational staff must be assigned to standard shifts (07-15 or 15-23).");
            }
        }

        // 2. Employee-defined Day Off
        if ($employee->day_off !== null && $assignmentDate->dayOfWeek === $employee->day_off) {
            throw new InvalidArgumentException("Employee has a defined day off for this date.");
        }

        // 3. Daily Limit: Max 8 hours per day
        if ($currentAssignments !== null) {
            $dailyHours = $currentAssignments
                ->filter(fn($a) => $a['employee_id'] === $employeeId && $a['date'] === $date)
                ->sum(fn($a) => $a['shift_duration']);
        } else {
            $dailyHours = ScaleAssignment::where('tenant_id', $tenantId)
                ->where('employee_id', $employeeId)
                ->where('date', $date)
                ->join('shifts', 'scale_assignments.shift_id', '=', 'shifts.id')
                ->sum('shifts.duration_hours');
        }

        if ($dailyHours + $shift->duration_hours > 8) {
            throw new InvalidArgumentException("Daily working limit of 8 hours exceeded.");
        }

        // 4. Inter-shift Rest: Min 11 hours rest
        $this->validateRestPeriod($tenantId, $employeeId, $shift, $assignmentDate, $currentAssignments);

        // 5. Weekly Limit: Max 44 hours per week
        $this->validateWeeklyLimit($tenantId, $employeeId, $shift, $assignmentDate, $currentAssignments);
    }

    protected function validateRestPeriod(string $tenantId, string $employeeId, Shift $newShift, Carbon $date, $currentAssignments = null): void
    {
        $startOfNewShift = Carbon::parse($date . ' ' . $newShift->start_time);
        $endOfNewShift = Carbon::parse($date . ' ' . $newShift->end_time);

        if ($currentAssignments !== null) {
            $assignments = $currentAssignments->filter(fn($a) => $a['employee_id'] === $employeeId && $a['date'] !== $date->toDateString());
        } else {
            $assignments = ScaleAssignment::where('tenant_id', $tenantId)
                ->where('employee_id', $employeeId)
                ->whereBetween('date', [
                    $date->copy()->subDay()->toDateString(),
                    $date->copy()->addDay()->toDateString()
                ])
                ->where('date', '!=', $date->toDateString())
                ->with('shift')
                ->get();
        }

        foreach ($assignments as $assignment) {
            $assignmentData = is_array($assignment) ? $assignment : $assignment;
            $shiftData = is_array($assignmentData) ? ($assignmentData['shift'] ?? null) : $assignmentData->shift;

            if (!$shiftData) continue;

            $prevStart = Carbon::parse($assignmentData['date'] . ' ' . ($shiftData->start_time ?? $shiftData['start_time']));
            $prevEnd = Carbon::parse($assignmentData['date'] . ' ' . ($shiftData->end_time ?? $shiftData['end_time']));

            if ($prevEnd < $startOfNewShift && $startOfNewShift->diffInHours($prevEnd) < 11) {
                throw new InvalidArgumentException("Minimum rest period of 11 hours required between shifts.");
            }

            if ($endOfNewShift < $prevStart && $prevStart->diffInHours($endOfNewShift) < 11) {
                throw new InvalidArgumentException("Minimum rest period of 11 hours required between shifts.");
            }
        }
    }

    protected function validateWeeklyLimit(string $tenantId, string $employeeId, Shift $newShift, Carbon $date, $currentAssignments = null): void
    {
        $startOfWeek = $date->copy()->startOfWeek();
        $endOfWeek = $date->copy()->endOfWeek();

        if ($currentAssignments !== null) {
            $weeklyHours = $currentAssignments
                ->filter(fn($a) => $a['employee_id'] === $employeeId && $a['date'] >= $startOfWeek->toDateString() && $a['date'] <= $endOfWeek->toDateString())
                ->sum(fn($a) => $a['shift_duration']);
        } else {
            $weeklyHours = ScaleAssignment::where('tenant_id', $tenantId)
                ->where('employee_id', $employeeId)
                ->whereBetween('date', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
                ->with('shift')
                ->get()
                ->sum(fn($a) => $a->shift->duration_hours);
        }

        if ($weeklyHours + $newShift->duration_hours > 44) {
            throw new InvalidArgumentException("Weekly working limit of 44 hours exceeded.");
        }
    }

    public function updateAssignment(string $tenantId, string $userId, string $employeeId, string $shiftId, string $date, ?string $observations = null): ScaleAssignment
    {
        $this->validateAssignment($tenantId, $employeeId, $shiftId, $date);

        return ScaleAssignment::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'employee_id' => $employeeId,
                'date' => $date,
            ],
            [
                'shift_id' => $shiftId,
                'user_id' => $userId,
                'observations' => $observations,
            ]
        );
    }

    public function generateScale(string $tenantId, string $userId): void
    {
        DB::transaction(function () use ($tenantId, $userId) {
            ScaleAssignment::where('tenant_id', $tenantId)->delete();

            $employees = Employee::where('tenant_id', $tenantId)->get();
            $shifts = Shift::where('tenant_id', $tenantId)->get();
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();

            $employeeHours = array_fill_keys($employees->pluck('id')->toArray(), 0);
            $currentAssignments = collect();
            $bulkAssignments = [];

            // Pre-calculate Sundays per employee for rotation
            $sundaysInMonth = collect();
            for ($d = $startOfMonth->copy(); $d->lte($endOfMonth); $d->addDay()) {
                if ($d->dayOfWeek === Carbon::SUNDAY) {
                    $sundaysInMonth->push($d->toDateString());
                }
            }

            // Assign 1 Sunday off to each operational employee
            $operationalEmployees = $employees->filter(fn($e) => in_array($e->sector, ['bar', 'kitchen', 'hall']));
            $sundayRotation = [];
            foreach ($operationalEmployees as $index => $emp) {
                $sundayOff = $sundaysInMonth->get($index % $sundaysInMonth->count());
                $sundayRotation[$emp->id] = $sundayOff;
            }

            for ($date = $startOfMonth->copy(); $date->lte($endOfMonth); $date->addDay()) {
                $dateString = $date->toDateString();

                foreach ($shifts as $shift) {
                    $sortedEmployees = $employees->sortBy(fn($e) => $employeeHours[$e->id]);

                    foreach ($sortedEmployees as $employee) {
                        try {
                            // Rule: Operational staff off on Mondays
                            if (in_array($employee->sector, ['bar', 'kitchen', 'hall']) && $date->dayOfWeek === Carbon::MONDAY) {
                                continue;
                            }

                            // Rule: Operational staff 1 Sunday off per month
                            if (isset($sundayRotation[$employee->id]) && $sundayRotation[$employee->id] === $dateString) {
                                continue;
                            }

                            $this->validateAssignment($tenantId, $employee->id, $shift->id, $dateString, $currentAssignments);

                            $assignment = [
                                'tenant_id' => $tenantId,
                                'user_id' => $userId,
                                'employee_id' => $employee->id,
                                'shift_id' => $shift->id,
                                'date' => $dateString,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];

                            $bulkAssignments[] = $assignment;
                            $currentAssignments->push(array_merge($assignment, ['shift_duration' => $shift->duration_hours]));
                            $employeeHours[$employee->id] += $shift->duration_hours;
                            break;
                        } catch (InvalidArgumentException $e) {
                            continue;
                        }
                    }
                }
            }

            foreach (array_chunk($bulkAssignments, 500) as $chunk) {
                ScaleAssignment::insert($chunk);
            }
        });
    }
}
