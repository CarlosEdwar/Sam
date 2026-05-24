<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->uuid('tenant_id')->nullable()->after('id')->index();
            $table->string('sector')->nullable()->after('department')->index();
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->uuid('tenant_id')->nullable()->after('id')->index();
        });

        Schema::table('scale_assignments', function (Blueprint $table) {
            $table->uuid('tenant_id')->nullable()->after('id')->index();
            $table->text('observations')->nullable()->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['tenant_id', 'sector']);
        });

        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });

        Schema::table('scale_assignments', function (Blueprint $table) {
            $table->dropColumn(['tenant_id', 'observations']);
        });
    }
};
