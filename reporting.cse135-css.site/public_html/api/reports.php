<?php
header("Content-Type: application/json");
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

// Ensure this path matches your server structure
$configPath = __DIR__ . '/../db_config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(["error" => "Database configuration missing"]);
    exit();
}

$config = include($configPath);

try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4", $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $method = $_SERVER['REQUEST_METHOD'];
    $report_id = $_GET['id'] ?? null;

    if ($method === 'GET') {
        if ($report_id) {
            // 1. Fetch the report
            $stmt = $pdo->prepare("SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id WHERE r.id = ?");
            $stmt->execute([$report_id]);
            $report = $stmt->fetch();

            if (!$report) {
                http_response_code(404);
                echo json_encode(["error" => "Report not found"]);
                exit();
            }

            // 2. Fetch associated comments for this specific report
            $stmt = $pdo->prepare("SELECT c.*, u.username FROM analyst_comments c JOIN users u ON c.user_id = u.id WHERE c.report_id = ? ORDER BY c.created_at DESC");
            $stmt->execute([$report_id]);
            $report['comments'] = $stmt->fetchAll();
            
            echo json_encode($report);
        } else {
            // Fetch list of all reports
            $stmt = $pdo->prepare("SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id");
            $stmt->execute();
            echo json_encode($stmt->fetchAll());
        }
    }
    // ... rest of your POST logic ...
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
}
?>