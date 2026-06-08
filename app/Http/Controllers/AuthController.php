<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user', // Explicitly set role
        ]);

        return $this->createdResponse([
            'user' => $user,
        ], '帳號已成功建立，請重新登入');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return $this->unauthorizedResponse('登入憑證無效');
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], '登入成功');
    }

    public function guestLogin(Request $request)
    {
        $user = User::where('email', 'guest@example.com')->first();
        
        if (!$user) {
            $user = User::create([
                'name' => 'Guest User',
                'email' => 'guest@example.com',
                'password' => Hash::make('guest123'),
                'role' => 'guest',
            ]);
        }

        $token = $user->createToken('guest_token')->plainTextToken;

        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], '以訪客身分登入成功');
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return $this->successResponse(null, '已登出');
    }

    public function index()
    {
        $users = User::all();
        return $this->successResponse($users);
    }

    public function destroy(Request $request, string $id)
    {
        if ($request->user()->id == $id) {
            return $this->errorResponse('無法刪除您自己的管理員帳號。', null, 400);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return $this->successResponse(null, '使用者已成功刪除');
    }
}
