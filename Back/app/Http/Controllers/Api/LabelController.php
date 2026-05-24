<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Label;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LabelController extends Controller
{
    public function index(Request $request)
    {
        // For now, we will use a dummy user_id or get it from a header until Clerk is integrated
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $query = Label::where('user_id', $userId);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('produto', 'like', "%$search%")
                  ->orWhere('codigo', 'like', "%$search%")
                  ->orWhere('lote', 'like', "%$search%")
                  ->orWhere('fornecedor', 'like', "%$search%")
                  ->orWhere('empresa', 'like', "%$search%");
            });
        }

        return $query->latest()->get(); // Frontend handles local pagination currently
    }

    public function store(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $validator = Validator::make($request->all(), [
            'produto' => 'required|string',
            'validade_dias' => 'nullable|integer',
            'validade_horas' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['user_id'] = $userId;

        $label = Label::create($data);

        return response()->json($label, 201);
    }

    public function import(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id') ?? 'default_user';
        
        $validator = Validator::make($request->all(), [
            'labels' => 'required|array|min:1',
            'labels.*.produto' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $importedLabels = [];
        
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();
            
            foreach ($request->labels as $labelData) {
                $labelData['user_id'] = $userId;
                // Ensure status is set if not provided
                if (!isset($labelData['status'])) {
                    $labelData['status'] = 'pendente';
                }
                
                $importedLabels[] = Label::create($labelData);
            }
            
            \Illuminate\Support\Facades\DB::commit();
            
            return response()->json([
                'message' => count($importedLabels) . ' labels imported successfully.',
                'data' => $importedLabels
            ], 201);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Log::error('Label Import Error: ' . $e->getMessage(), [
                'user_id' => $userId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to import labels',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Label $label)
    {
        return $label;
    }

    public function update(Request $request, Label $label)
    {
        $label->update($request->all());
        return response()->json($label);
    }

    public function destroy(Label $label)
    {
        $label->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
