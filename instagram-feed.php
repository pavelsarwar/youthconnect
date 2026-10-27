<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=900');
header('X-Content-Type-Options: nosniff');
$configPath = '/home/youthhub/ycf-instagram-config.php';
$config = is_file($configPath) ? require $configPath : [];
$token = (string)($config['access_token'] ?? getenv('YCF_IG_ACCESS_TOKEN') ?: '');
$userId = (string)($config['instagram_user_id'] ?? getenv('YCF_IG_USER_ID') ?: '');
if (!$token || !preg_match('/^[0-9]+$/', $userId)) {
    http_response_code(503);
    echo json_encode(['items'=>[], 'message'=>'Instagram feed is not configured yet.']);
    exit;
}
$cache = sys_get_temp_dir().'/ycf_ig_'.hash('sha256', $userId).'.json';
if (is_file($cache) && time() - filemtime($cache) < 1800) {
    readfile($cache);
    exit;
}
$fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';
$url = 'https://graph.facebook.com/v23.0/'.rawurlencode($userId).'/media?fields='.rawurlencode($fields).'&limit=24&access_token='.rawurlencode($token);
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>12,CURLOPT_SSL_VERIFYPEER=>true]);
$body = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = $body ? json_decode($body, true) : null;
if ($status !== 200 || !is_array($data) || !isset($data['data'])) {
    if (is_file($cache)) { readfile($cache); exit; }
    http_response_code(502);
    echo json_encode(['items'=>[], 'message'=>'Instagram photos are temporarily unavailable.']);
    exit;
}
$items = [];
foreach ($data['data'] as $post) {
    $type = $post['media_type'] ?? '';
    $media = $type === 'VIDEO' ? ($post['thumbnail_url'] ?? '') : ($post['media_url'] ?? '');
    if (!$media && $type === 'CAROUSEL_ALBUM') {
        $child = $post['children']['data'][0] ?? [];
        $media = $child['media_url'] ?? $child['thumbnail_url'] ?? '';
    }
    $permalink = $post['permalink'] ?? '';
    if (!$media || !preg_match('~^https://~', $media) || !preg_match('~^https://www\\.instagram\\.com/~', $permalink)) continue;
    $items[] = ['image'=>$media,'url'=>$permalink,'caption'=>mb_substr((string)($post['caption'] ?? ''),0,240),'date'=>$post['timestamp'] ?? ''];
}
$output = json_encode(['items'=>$items], JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
if ($output !== false) {
    @file_put_contents($cache, $output, LOCK_EX);
    echo $output;
}
