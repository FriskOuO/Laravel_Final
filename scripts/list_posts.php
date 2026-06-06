<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$posts = App\Models\Post::with('user')->get();
foreach ($posts as $p) {
    echo $p->id . "\t" . $p->title . "\t" . ($p->user_id ?? 'NULL') . "\t" . ($p->user ? $p->user->email : 'NULL') . "\n";
}
