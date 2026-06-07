<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Return a success response.
     */
    protected function successResponse($data = null, string $message = '', int $code = 200, string $status = 'success'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'status' => $status,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Return a created (201) response.
     */
    protected function createdResponse($data = null, string $message = ''): JsonResponse
    {
        return $this->successResponse($data, $message, 201, 'created');
    }

    /**
     * Return an error response.
     */
    protected function errorResponse(string $message = '', $errors = null, int $code = 400, string $status = 'error'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'status' => $status,
            'message' => $message,
            'errors' => $errors,
            'data' => null,
        ], $code);
    }

    /**
     * Return an unauthorized response.
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->errorResponse($message, null, 401, 'unauthorized');
    }

    /**
     * Return a forbidden response.
     */
    protected function forbiddenResponse(string $message = 'Forbidden'): JsonResponse
    {
        return $this->errorResponse($message, null, 403, 'forbidden');
    }

    /**
     * Return a not found response.
     */
    protected function notFoundResponse(string $message = 'Not found'): JsonResponse
    {
        return $this->errorResponse($message, null, 404, 'not_found');
    }

    /**
     * Return a validation error response.
     */
    protected function validationErrorResponse($errors = null, string $message = 'Validation failed'): JsonResponse
    {
        return $this->errorResponse($message, $errors, 422, 'validation_error');
    }
}
