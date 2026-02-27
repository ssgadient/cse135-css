<?php
// 1. Database Connection
$config = include('db_config.php');

$host = $config['host'];
$db   = $config['db'];
$user = $config['user'];
$pass = $config['pass'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// 2. Get Raw Body (JSON)
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if ($data) {
    // 3. Prepare the Insert
    $stmt = $pdo->prepare("INSERT INTO metric_logs 
        (session_id, event_type, page_url, page_title, referrer, client_timestamp, event_data, ip_address) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    // Convert the 'data' sub-object back to JSON for the database column
    $eventSpecificData = json_encode($data['data'] ?? []);

    $stmt->execute([
        $data['session_id'] ?? null,
        $data['type'] ?? 'unknown',
        $data['url'] ?? null,
        $data['title'] ?? null,
        $data['referrer'] ?? null,
        $data['timestamp'] ?? null,
        $eventSpecificData,
        $_SERVER['REMOTE_ADDR']
    ]);
}

// 4. Return success (Beacon requires a 2xx or 4xx response)
http_response_code(200);
echo json_encode(["status" => "success"]);