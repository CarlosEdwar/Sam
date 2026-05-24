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
        Schema::create('labels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('codigo')->nullable();
            $table->string('produto');
            $table->string('fornecedor')->nullable();
            $table->string('lote')->nullable();
            $table->string('data_manipulacao')->nullable();
            $table->integer('validade_dias')->nullable();
            $table->integer('validade_horas')->nullable();
            $table->string('armazenamento')->nullable();
            $table->integer('descongelado_dias')->nullable();
            $table->string('sif')->nullable();
            $table->string('rastreabilidade')->nullable();
            $table->string('empresa')->nullable();
            $table->text('observacao')->nullable();
            $table->string('status')->default('pendente');
            $table->string('user_id'); // Clerk User ID
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labels');
    }
};
