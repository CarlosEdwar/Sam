<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'start_time', 'end_time', 'duration_hours', 'user_id', 'tenant_id'];

    public function assignments(): HasMany
    {
        return $this->hasMany(ScaleAssignment::class);
    }
}
