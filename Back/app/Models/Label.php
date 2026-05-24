<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Label extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'codigo',
        'produto',
        'fornecedor',
        'lote',
        'data_manipulacao',
        'validade_dias',
        'validade_horas',
        'armazenamento',
        'descongelado_dias',
        'sif',
        'rastreabilidade',
        'empresa',
        'observacao',
        'status',
        'user_id',
    ];

    protected $casts = [
        'validade_dias' => 'integer',
        'validade_horas' => 'integer',
        'descongelado_dias' => 'integer',
    ];
}
