<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::latest()->first(); // check the most recently created user
if ($user) {
    echo "User ID: " . $user->id . "\n";
    print_r($user->posts()->get()->toArray());
} else {
    echo "No user found.\n";
}
