<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Clerk-Tenant-Id', 'default-tenant');
        $employees = Employee::where('tenant_id', $tenantId)->get();

        return response()->json($employees);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'role'       => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'sector'     => 'nullable|string|max:50',
            'day_off'    => 'nullable|integer|between:0,6',
        ]);

        try {
            $userId = $request->header('X-Clerk-User-Id', 'system');
            $tenantId = $request->header('X-Clerk-Tenant-Id', 'default-tenant');
            $employee = Employee::create(array_merge($validated, [
                'user_id'   => $userId,
                'tenant_id' => $tenantId,
            ]));
            return response()->json($employee, 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'sometimes|string|max:255',
            'role'       => 'sometimes|string|max:100',
            'department' => 'sometimes|string|max:100',
            'sector'     => 'nullable|string|max:50',
            'day_off'    => 'nullable|integer|between:0,6',
        ]);

        try {
            $employee = Employee::findOrFail($id);
            $employee->update($validated);
            return response()->json($employee);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($id);
            $employee->delete();
            return response()->json(null, 204);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
