<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
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
            'title' => 'sometimes|required|string|max:255|min:3',
            'content' => 'sometimes|required|string|min:5',
            'mood' => 'sometimes|required|string|in:happy,neutral,sad',
            'date' => 'sometimes|required|date',
            'image_url' => 'nullable|url|max:2048',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => '日記標題為必填項',
            'title.min' => '日記標題至少需 3 個字元',
            'title.max' => '日記標題最多 255 個字元',
            'content.required' => '日記內容為必填項',
            'content.min' => '日記內容至少需 5 個字元',
            'mood.required' => '心情為必填項',
            'mood.in' => '心情必須為：快樂、平常或難過',
            'date.required' => '日期為必填項',
            'date.date' => '日期格式錯誤',
            'image_url.url' => '圖片 URL 格式錯誤',
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
