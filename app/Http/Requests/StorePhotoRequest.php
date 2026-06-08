<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePhotoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'photo' => 'required',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'photo.required' => '照片為必填項',
            'photo.image' => '上傳的檔案必須是圖片',
            'photo.mimes' => '照片格式必須為：jpg、jpeg、png、gif 或 webp',
            'photo.max' => '照片大小不能超過 2MB',
        ];
    }
}
