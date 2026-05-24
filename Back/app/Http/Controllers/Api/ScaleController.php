<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Shift;
use App\Models\ScaleAssignment;
use App\Services\ScaleService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Exception;

class ScaleController extends Controller
{
    protected $scaleService;

    public function __construct(ScaleService $scaleService)
    {
        $this->scaleService = $scaleService;
    }

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Clerk-Tenant-Id', 'default-tenant');
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $employees = Employee::where('tenant_id', $tenantId)->get();
        $shifts = Shift::where('tenant_id', $tenantId)->get();
        $assignments = ScaleAssignment::where('tenant_id', $tenantId)
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->get();

        return response()->json([
            'employees' => $employees,
            'shifts' => $shifts,
            'assignments' => $assignments,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'shift_id' => 'required|uuid|exists:shifts,id',
            'date' => 'required|date',
            'observations' => 'nullable|string',
        ]);

        try {
            $tenantId = $request->header('X-Clerk-Tenant-Id', 'default-tenant');
            $userId = $request->header('X-Clerk-User-Id', 'system');
            $assignment = $this->scaleService->updateAssignment(
                $tenantId,
                $userId,
                $validated['employee_id'],
                $validated['shift_id'],
                $validated['date'],
                $validated['observations'] ?? null
            );

            return response()->json($assignment);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function generate(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->header('X-Clerk-Tenant-Id', 'default-tenant');
            $userId = $request->header('X-Clerk-User-Id', 'system');
            $this->scaleService->generateScale($tenantId, $userId);
            return response()->json(['message' => 'Scale generated successfully']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateEmployeeDayOff(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'day_off'     => 'nullable|integer|between:0,6', // nullable: "Nenhuma" envia null
            'sector'      => 'nullable|string',
        ]);

        try {
            $tenantId = $request->header('X-Clerk-Tenant-Id', 'default-tenant');
            $employee = Employee::where('tenant_id', $tenantId)->findOrFail($validated['employee_id']);

            $updateData = ['day_off' => $validated['day_off'] ?? null];
            if (isset($validated['sector'])) {
                $updateData['sector'] = $validated['sector'];
            }

            $employee->update($updateData);

            return response()->json($employee);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function exportPdf(): \Illuminate\Http\Response
    {
        // Basic implementation: return a simple text response instead of PDF for now,
        // as PDF generation requires additional libraries like dompdf.
        return response("PDF Export of Scale - Basic Implementation\n\nThis is a placeholder for the PDF binary stream.")
            ->header('Content-Type', 'application/pdf');
    }
}
