<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'role', 'department', 'user_id', 'day_off', 'tenant_id', 'sector'];

    public function assignments(): HasMany
    {
        return $this->hasMany(ScaleAssignment::class);
    }
}
