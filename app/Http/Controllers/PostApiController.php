<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;

class PostApiController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (Auth::user()->role === 'admin') {
            $diaries = Post::orderByDesc('date')->get();
        } else {
            // Duplicate template/sample posts (owned by user@example.com) into the
            // current user's account if they don't already have them. This ensures
            // each user can edit/delete their own copy of the example posts.
            $user = Auth::user();
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
                    ]);
                }
            }

            $diaries = $user->posts()->orderByDesc('date')->get();
        }

        return $this->successResponse($diaries, '日記列表已取得');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request)
    {
        $data = $request->validated();
        $diary = Auth::user()->posts()->create($data);

        return $this->createdResponse($diary, '日記已建立');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        if (Auth::user()->role === 'admin') {
            $diary = Post::find($id);
        } else {
            $diary = Auth::user()->posts()->find($id);
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
        if (Auth::user()->role === 'admin') {
            $diary = Post::find($id);
        } else {
            $diary = Auth::user()->posts()->find($id);
        }

        if (!$diary) {
            return $this->notFoundResponse('日記未找到');
        }

        $data = $request->validated();
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
