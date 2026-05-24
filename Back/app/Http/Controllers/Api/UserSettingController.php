<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSetting;
use Illuminate\Http\Request;

class UserSettingController extends Controller
{
    /**
     * GET /api/settings
     * Returns the full settings record for the authenticated user.
     */
    public function show(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $setting = UserSetting::where('user_id', $userId)->first();

        return response()->json([
            'app_config'   => $setting?->app_config   ?? $this->defaultAppConfig(),
            'system_prefs' => $setting?->system_prefs ?? $this->defaultSystemPrefs(),
        ]);
    }

    /**
     * PUT /api/settings
     * Upserts the settings record for the authenticated user.
     * Accepts { app_config?: {...}, system_prefs?: {...} }
     */
    public function update(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $setting = UserSetting::firstOrNew(['user_id' => $userId]);

        if ($request->has('app_config')) {
            $setting->app_config = array_merge(
                $setting->app_config ?? $this->defaultAppConfig(),
                $request->input('app_config')
            );
        }

        if ($request->has('system_prefs')) {
            $setting->system_prefs = array_merge(
                $setting->system_prefs ?? $this->defaultSystemPrefs(),
                $request->input('system_prefs')
            );
        }

        $setting->save();

        return response()->json([
            'app_config'   => $setting->app_config,
            'system_prefs' => $setting->system_prefs,
        ]);
    }

    // ─── Defaults ────────────────────────────────────────────────────────────

    private function defaultAppConfig(): array
    {
        return [
            'labelFormat'    => '50x25',
            'defaultPrinter' => '',
            'autoPrint'      => false,
            'copies'         => 1,
        ];
    }

    private function defaultSystemPrefs(): array
    {
        return [
            'language'    => 'pt-BR',
            'timezone'    => 'America/Sao_Paulo',
            'theme'       => 'system',
            'printerName' => null,
        ];
    }
}
