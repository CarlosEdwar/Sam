<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'sku',
        'category',
        'stock',
        'min_stock',
        'status',
        'user_id',
    ];

    protected $casts = [
        'stock' => 'integer',
        'min_stock' => 'integer',
    ];
}
