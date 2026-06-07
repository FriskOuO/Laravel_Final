<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string|array  $roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json([
                'success' => false,
                'status' => 'unauthorized',
                'message' => '未驗證。',
                'errors' => null,
                'data' => null,
            ], 401);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'success' => false,
                'status' => 'forbidden',
                'message' => '禁止存取。您沒有所需的角色權限。',
                'errors' => null,
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
