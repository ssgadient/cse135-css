<?php
session_start();
header('Content-Type: application/json');

// 1. Security Check: Ensure the user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized: Please log in."]);
    exit();
}

// 2. Load the Database Config
$configPath = __DIR__ . '/../../db_config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(["error" => "Database configuration file missing."]);
    exit();
}
$config = require($configPath);

try {
    // 3. Connect to Database
    $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // 4. Query: Fetch reports joined with usernames for the author requirement
    // This provides the context your teammate asked for.
    $sql = "SELECT r.id, r.title, r.category, c.comment, u.username as analyst_name 
            FROM reports r 
            LEFT JOIN analyst_comments c ON r.id = c.report_id 
            LEFT JOIN users u ON c.user_id = u.id";

    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll();

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
}