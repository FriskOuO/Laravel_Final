<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePhotoRequest;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePhotoRequest $request)
    {
        \Illuminate\Support\Facades\Log::info('Photo upload request received');
        try {
            if (!$request->hasFile('photo')) {
                \Illuminate\Support\Facades\Log::warning('No photo file in request');
                return $this->errorResponse('未收到照片檔案', null, 422);
            }
            
            $file = $request->file('photo');
            \Illuminate\Support\Facades\Log::info('File info:', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType()
            ]);

            $path = $file->store('diaries', 'public');
            $url = Storage::disk('public')->url($path);

            return $this->createdResponse([
                'url' => $url,
            ], '圖片已上傳成功');
        } catch (\Exception $e) {
            return $this->errorResponse('圖片上傳失敗：' . $e->getMessage(), null, 500);
        }
    }
}
