<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PrintJobController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');
        
        $query = PrintJob::where('user_id', $userId);
        
        return $query->latest()->get();
    }

    public function store(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $validator = Validator::make($request->all(), [
            'jobId' => 'required|string',
            'productName' => 'required|string',
            'sku' => 'required|string',
            'quantity' => 'required|integer',
            'status' => 'required|string',
            'operator' => 'required|string',
            'printer' => 'required|string',
            'method' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['user_id'] = $userId;

        $printJob = PrintJob::create($data);

        return response()->json($printJob, 201);
    }
}
