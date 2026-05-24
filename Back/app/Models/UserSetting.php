<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    protected $table = 'user_settings';

    protected $fillable = [
        'user_id',
        'app_config',
        'system_prefs',
    ];

    protected $casts = [
        'app_config'   => 'array',
        'system_prefs' => 'array',
    ];
}
