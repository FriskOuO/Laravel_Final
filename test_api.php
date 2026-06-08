<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$admin = User::where('role', 'admin')->first();
$token = $admin->createToken('test')->plainTextToken;

$client = new \GuzzleHttp\Client();
$response = $client->request('GET', 'http://localhost:8000/api/users', [
    'headers' => [
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ]
]);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Body: " . $response->getBody() . "\n";
