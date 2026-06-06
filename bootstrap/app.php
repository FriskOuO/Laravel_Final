<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'ensuretoken' => \App\Http\Middleware\EnsureTokenIsValid::class,
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle Model not found exceptions (404)
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => '資源未找到',
                'errors' => null,
                'data' => null,
            ], 404);
        });

        // Handle validation exceptions (422)
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'status' => 'validation_error',
                'message' => '驗證失敗',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        });

        // Handle authentication exceptions (401)
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e) {
            return response()->json([
                'success' => false,
                'status' => 'unauthorized',
                'message' => '未授權，請提供有效的 Token',
                'errors' => null,
                'data' => null,
            ], 401);
        });

        // Handle authorization exceptions (403)
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'success' => false,
                'status' => 'forbidden',
                'message' => '禁止存取',
                'errors' => null,
                'data' => null,
            ], 403);
        });

        // Handle HTTP exceptions
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json([
                'success' => false,
                'status' => 'http_error',
                'message' => $e->getMessage() ?: 'HTTP 錯誤',
                'errors' => null,
                'data' => null,
            ], $e->getStatusCode());
        });

        // Handle generic exceptions (500)
        $exceptions->render(function (\Exception $e) {
            return response()->json([
                'success' => false,
                'status' => 'server_error',
                'message' => '伺服器內部錯誤',
                'errors' => null,
                'data' => null,
            ], 500);
        });
    })->create();
