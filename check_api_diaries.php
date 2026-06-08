<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Post;

$user = User::latest()->first();
echo "User ID: " . $user->id . " Role: " . $user->role . "\n";
$diaries = Post::with('user')->where('user_id', $user->id)
    ->orWhere('is_public', true)
    ->orderByDesc('date')
    ->get();
echo "Diaries returned:\n";
foreach($diaries as $d) {
    echo "ID: {$d->id}, Title: {$d->title}, UserID: {$d->user_id}, Public: {$d->is_public}\n";
}
