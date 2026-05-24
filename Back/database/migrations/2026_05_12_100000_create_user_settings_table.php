<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->unique();
            // App-level config (labelFormat, defaultPrinter, autoPrint, copies)
            $table->json('app_config')->nullable();
            // System preferences (language, timezone, theme, printerName)
            $table->json('system_prefs')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
