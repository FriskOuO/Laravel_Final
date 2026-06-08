<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;

class PostApiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = request()->user('sanctum');

        if ($user && $user->role === 'admin') {
            // Admin sees everything
            $diaries = Post::with('user')->orderByDesc('date')->get();
        } elseif ($user) {
            // Logged in user: sees OWN diaries + ALL PUBLIC diaries from others
            // Also ensure template posts are handled for the user
            $templateOwnerEmail = env('TEMPLATE_OWNER_EMAIL', 'user@example.com');

            $templatePosts = Post::whereHas('user', function ($q) use ($templateOwnerEmail) {
                $q->where('email', $templateOwnerEmail);
            })->get();

            foreach ($templatePosts as $tpl) {
                $exists = $user->posts()
                    ->where('title', $tpl->title)
                    ->whereDate('date', $tpl->date)
                    ->exists();

                if (! $exists) {
                    $user->posts()->create([
                        'title' => $tpl->title,
                        'content' => $tpl->content,
                        'mood' => $tpl->mood,
                        'date' => $tpl->date,
                        'image_url' => $tpl->image_url,
                        'is_public' => false,
                    ]);
                }
            }

            // The core change: User's posts OR any public posts
            $diaries = Post::with('user')->where('user_id', $user->id)
                ->orWhere('is_public', true)
                ->orderByDesc('date')
                ->get();
        } else {
            // Guest: only see public diaries
            $diaries = Post::with('user')->where('is_public', true)->orderByDesc('date')->get();
        }

        return $this->successResponse($diaries, '日記列表已取得');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request)
    {
        \Illuminate\Support\Facades\Log::info('Store Diary Request:', $request->all());
        \Illuminate\Support\Facades\Log::info('Current User ID: ' . Auth::id());
        $data = $request->validated();
        // Handle checkbox: if missing, it means it's private (false)
        $data['is_public'] = $request->boolean('is_public', false);
        
        $diary = Auth::user()->posts()->create($data);

        return $this->createdResponse($diary->load('user'), '日記已建立');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = request()->user('sanctum');

        if ($user && $user->role === 'admin') {
            $diary = Post::with('user')->find($id);
        } elseif ($user) {
            $diary = Post::with('user')->where(function($q) use ($user, $id) {
                $q->where('user_id', $user->id)->orWhere('is_public', true);
            })->find($id);
        } else {
            $diary = Post::with('user')->where('is_public', true)->find($id);
        }

        if (!$diary) {
            return $this->notFoundResponse('日記未找到');
        }

        return $this->successResponse($diary);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePostRequest $request, string $id)
    {
        \Illuminate\Support\Facades\Log::info('Update Diary Request ID ' . $id . ':', $request->all());
        if (Auth::user()->role === 'admin') {
            $diary = Post::find($id);
        } else {
            $diary = Auth::user()->posts()->find($id);
        }

        if (!$diary) {
            return $this->notFoundResponse('日記未找到');
        }

        $data = $request->validated();
        // Handle checkbox: if missing, it means it's private (false)
        $data['is_public'] = $request->boolean('is_public', false);
        
        $diary->update($data);

        return $this->successResponse($diary, '日記已更新');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        if (Auth::user()->role === 'admin') {
            $diary = Post::find($id);
        } else {
            $diary = Auth::user()->posts()->find($id);
        }

        if (!$diary) {
            return $this->notFoundResponse('日記未找到');
        }

        $diary->delete();

        return $this->successResponse(null, '日記已刪除');
    }
}
