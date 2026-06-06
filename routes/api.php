<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\PostApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/guest-login', [AuthController::class, 'guestLogin']);

// Public routes
Route::get('/diaries', [PostApiController::class, 'index']);
Route::get('/diaries/{id}', [PostApiController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Photo upload (for authenticated users)
    Route::post('/photos', [PhotoController::class, 'store']);

    // Diary management (requires specific roles)
    Route::middleware('role:user,admin')->group(function () {
        Route::post('/diaries', [PostApiController::class, 'store']);
        Route::put('/diaries/{id}', [PostApiController::class, 'update']);
        Route::delete('/diaries/{id}', [PostApiController::class, 'destroy']);
    });
});
