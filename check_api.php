<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Post;

$user = User::find(11);
echo "User ID: " . $user->id . "\n";
$diaries = Post::with('user')->where('user_id', $user->id)
    ->orWhere('is_public', true)
    ->orderByDesc('date')
    ->get();
echo "Found diaries: " . count($diaries) . "\n";
