<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePhotoRequest;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePhotoRequest $request)
    {
        try {
            $path = $request->file('photo')->store('diaries', 'public');
            $url = Storage::disk('public')->url($path);

            return $this->createdResponse([
                'url' => $url,
            ], '圖片已上傳成功');
        } catch (\Exception $e) {
            return $this->errorResponse('圖片上傳失敗：' . $e->getMessage(), null, 500);
        }
    }
}
