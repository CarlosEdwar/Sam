<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use App\Models\Employee;
use App\Models\Shift;
use Database\Seeders\ScaleSeeder;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "Starting DB cleanup..." . PHP_EOL;

try {
    // 1. Delete assignments
    $deletedAssignments = DB::delete('DELETE FROM scale_assignments');
    echo "Deleted assignments: $deletedAssignments" . PHP_EOL;

    // 2. Delete shifts
    $deletedShifts = DB::delete('DELETE FROM shifts');
    echo "Deleted shifts: $deletedShifts" . PHP_EOL;

    // 3. Delete employees
    $deletedEmployees = DB::delete('DELETE FROM employees');
    echo "Deleted employees: $deletedEmployees" . PHP_EOL;

    // 4. Run the seeder
    echo "Running ScaleSeeder..." . PHP_EOL;
    $seeder = new ScaleSeeder();
    $seeder->run();

    echo "Seeding completed successfully!" . PHP_EOL;
    echo "Current Employees count: " . Employee::count() . PHP_EOL;
    echo "Current Shifts count: " . Shift::count() . PHP_EOL;

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
