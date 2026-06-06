<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Post;
use App\Models\User;

$owner = User::where('email', 'user@example.com')->first();
if (!$owner) {
    echo "Owner user@example.com not found\n";
    exit(1);
}

$today = (new DateTime())->format('Y-m-d');
$mapping = [
    2 => [
        'title' => '安靜的早晨重置',
        'content' => '慢慢沖了一杯咖啡，寫下簡短清單，並讓第一個小時遠離螢幕。整天的節奏因此柔和許多。',
        'mood' => 'happy',
        'date' => $today,
        'image_url' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    ],
    3 => [
        'title' => '通勤路上的想法',
        'content' => '坐在車上看著周圍的人，也留意到自己其實很累。沒有什麼戲劇化，只是一個普通到不能再普通的週三。',
        'mood' => 'neutral',
        'date' => '2026-06-02',
        'image_url' => '',
    ],
    4 => [
        'title' => '下雨的傍晚',
        'content' => '回家時剛好下雨。我取消了晚餐行程，看著窗外，讓安靜慢慢把心情整理好。',
        'mood' => 'sad',
        'date' => '2026-06-01',
        'image_url' => 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=900&q=80',
    ],
];

foreach ($mapping as $id => $data) {
    $post = Post::find($id);
    if ($post) {
        $post->title = $data['title'];
        $post->content = $data['content'];
        $post->mood = $data['mood'];
        $post->date = $data['date'];
        $post->image_url = $data['image_url'];
        $post->user_id = $owner->id;
        $post->save();
        echo "Updated post id={$id} -> {$data['title']}\n";
    } else {
        // create new post with given id
        $new = new Post();
        $new->id = $id;
        $new->title = $data['title'];
        $new->content = $data['content'];
        $new->mood = $data['mood'];
        $new->date = $data['date'];
        $new->image_url = $data['image_url'];
        $new->user_id = $owner->id;
        $new->save();
        echo "Created post id={$new->id} -> {$data['title']}\n";
    }
}

echo "Done.\n";
