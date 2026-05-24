<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClerkAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // In a production environment, you should verify the Clerk JWT here.
        // For now, we are relying on the X-Clerk-User-Id header sent by the frontend
        // or a proxy (like a Clerk integration).
        
        $userId = $request->header('X-Clerk-User-Id');

        if (!$userId && config('app.env') === 'production') {
            return response()->json(['error' => 'Unauthorized. Clerk User ID missing.'], 401);
        }

        // Fallback for development if header is missing
        if (!$userId) {
            $userId = 'dev_user_123';
            $request->headers->set('X-Clerk-User-Id', $userId);
        }

        return $next($request);
    }
}
