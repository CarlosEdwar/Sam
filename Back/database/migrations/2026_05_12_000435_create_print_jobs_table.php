<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('jobId');
            $table->string('productName');
            $table->string('sku');
            $table->integer('quantity');
            $table->string('status');
            $table->string('operator');
            $table->string('printer');
            $table->string('method');
            $table->string('user_id');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
