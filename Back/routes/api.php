<?php

use App\Http\Controllers\Api\LabelController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\PrintJobController;
use App\Http\Controllers\Api\UserSettingController;
use App\Http\Controllers\Api\ScaleController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ShiftController;
use Illuminate\Support\Facades\Route;

Route::get('/user', function () {
    return response()->json(['name' => 'SamLabel User']);
});

Route::middleware('clerk')->prefix('labels')->group(function () {
    Route::get('/', [LabelController::class, 'index']);
    Route::post('/', [LabelController::class, 'store']);
    Route::post('/import', [LabelController::class, 'import']);
    Route::get('/{label}', [LabelController::class, 'show']);
    Route::put('/{label}', [LabelController::class, 'update']);
    Route::delete('/{label}', [LabelController::class, 'destroy']);
});

Route::middleware('clerk')->prefix('employees')->group(function () {
    Route::get('/', [EmployeeController::class, 'index']);
    Route::post('/', [EmployeeController::class, 'store']);
    Route::put('/{id}', [EmployeeController::class, 'update']);
    Route::delete('/{id}', [EmployeeController::class, 'destroy']);
});

Route::middleware('clerk')->prefix('shifts')->group(function () {
    Route::get('/', [ShiftController::class, 'index']);
    Route::post('/', [ShiftController::class, 'store']);
    Route::put('/{id}', [ShiftController::class, 'update']);
    Route::delete('/{id}', [ShiftController::class, 'destroy']);
});

Route::middleware('clerk')->prefix('inventory')->group(function () {
    Route::get('/', [InventoryController::class, 'index']);
    Route::post('/', [InventoryController::class, 'store']);
    Route::post('/import', [InventoryController::class, 'import']);
    Route::get('/{inventoryItem}', [InventoryController::class, 'show']);
    Route::put('/{inventoryItem}', [InventoryController::class, 'update']);
    Route::delete('/{inventoryItem}', [InventoryController::class, 'destroy']);
});

Route::middleware('clerk')->prefix('print-jobs')->group(function () {
    Route::get('/', [PrintJobController::class, 'index']);
    Route::post('/', [PrintJobController::class, 'store']);
});

Route::middleware('clerk')->prefix('dashboard')->group(function () {
    Route::get('/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);
});

Route::middleware('clerk')->prefix('settings')->group(function () {
    Route::get('/', [UserSettingController::class, 'show']);
    Route::put('/', [UserSettingController::class, 'update']);
});

Route::middleware('clerk')->prefix('escalas')->group(function () {
    Route::get('/', [ScaleController::class, 'index']);
    Route::post('/gerar', [ScaleController::class, 'generate']);
    Route::patch('/', [ScaleController::class, 'update']);
    Route::patch('/employee/day-off', [ScaleController::class, 'updateEmployeeDayOff']);
    Route::get('/export/pdf', [ScaleController::class, 'exportPdf']);

});
