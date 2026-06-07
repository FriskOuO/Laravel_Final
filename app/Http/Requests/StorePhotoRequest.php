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
            'photo' => 'required|image|mimes:jpg,jpeg,png,gif,webp|max:2048',
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

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        $response = response()->json([
            'success' => false,
            'status' => 'validation_error',
            'message' => '驗證失敗',
            'errors' => $validator->errors(),
            'data' => null,
        ], 422);

        throw new \Illuminate\Validation\ValidationException($validator, $response);
    }
}
