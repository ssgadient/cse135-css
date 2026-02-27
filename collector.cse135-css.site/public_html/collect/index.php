<?php
// Turn on every possible error reporter
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$config = include('db_config.php');

try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4", $config['user'], $config['pass']);
    // FORCE PDO to throw an exception if the SQL is wrong
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    if (!$data) {
        throw new Exception("Invalid JSON received");
    }

    $stmt = $pdo->prepare("INSERT INTO metric_logs 
        (session_id, event_type, page_url, page_title, referrer, client_timestamp, event_data, ip_address) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

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

    echo json_encode(["status" => "success", "message" => "Inserted ID: " . $pdo->lastInsertId()]);
    http_response_code(200);
    
} catch (Exception $e) {
    // If it fails, this will show up in your Browser Network Tab 'Response'
    http_response_code(500);
    echo json_encode(["status" => "error", "error_message" => $e->getMessage()]);
}