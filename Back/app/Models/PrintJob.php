<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintJob extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'jobId',
        'productName',
        'sku',
        'quantity',
        'status',
        'operator',
        'printer',
        'method',
        'user_id',
    ];
}
