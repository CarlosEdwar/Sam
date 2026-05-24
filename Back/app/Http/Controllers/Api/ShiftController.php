<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class ShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->header('X-Clerk-User-Id', 'system');
        $shifts = Shift::where('user_id', $userId)->orWhere('user_id', null)->get();

        return response()->json($shifts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'duration_hours' => 'required|numeric',
        ]);

        try {
            $userId = $request->header('X-Clerk-User-Id', 'system');
            $shift = Shift::create(array_merge($validated, ['user_id' => $userId]));
            return response()->json($shift, 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'duration_hours' => 'sometimes|numeric',
        ]);

        try {
            $shift = Shift::findOrFail($id);
            $shift->update($validated);
            return response()->json($shift);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $shift = Shift::findOrFail($id);
            $shift->delete();
            return response()->json(null, 204);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
