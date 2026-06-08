<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class LogRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/photos*')) {
            Log::info('Incoming Photos Request:', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'has_file' => $request->hasFile('photo'),
                'files' => array_keys($request->allFiles()),
                'content_type' => $request->header('Content-Type'),
            ]);
        }
        
        return $next($request);
    }
}
