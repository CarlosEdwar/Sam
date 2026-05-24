<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Label;
use App\Models\PrintJob;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $totalImpressions = PrintJob::where('user_id', $userId)
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        $pendingLabels = Label::where('user_id', $userId)
            ->where('status', 'pendente')
            ->count();

        $activePrintersCount = PrintJob::where('user_id', $userId)
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->distinct('printer')
            ->count('printer');
        
        $activePrinters = $activePrintersCount > 0 ? "{$activePrintersCount}/1" : "0/1";

        $performance = $totalImpressions > 50 ? 'Excelente' : ($totalImpressions > 10 ? 'Boa' : 'Normal');

        return response()->json([
            'totalImpressions' => $totalImpressions,
            'pendingLabels' => $pendingLabels,
            'activePrinters' => $activePrinters,
            'performance' => $performance,
        ]);
    }
}
