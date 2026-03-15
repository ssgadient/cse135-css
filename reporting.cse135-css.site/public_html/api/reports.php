<?php
header("Content-Type: application/json");
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$configPath = __DIR__ . '/../../db_config.php';
$config = include($configPath);

try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4", $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$role = $_SESSION['role'];
$user_id = $_SESSION['user_id'];
$sections = $_SESSION['sections'] ?? [];

if ($method === 'GET') {
    $report_id = $_GET['id'] ?? null;
    
    if ($report_id) {
        // Fetch specific report and its comments
        $stmt = $pdo->prepare("SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id WHERE r.id = ?");
        $stmt->execute([$report_id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            http_response_code(404);
            echo json_encode(["error" => "Report not found"]);
            exit();
        }

        // Check if analyst has access to this category
        if ($role === 'analyst' && !in_array($report['category'], $sections)) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied to this report category"]);
            exit();
        }

        $stmt = $pdo->prepare("SELECT c.*, u.username FROM analyst_comments c JOIN users u ON c.user_id = u.id WHERE c.report_id = ? ORDER BY c.created_at DESC");
        $stmt->execute([$report_id]);
        $report['comments'] = $stmt->fetchAll();
        
        echo json_encode($report);
    } else {
        // Fetch all reports accessible to user
        $query = "SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id";
        $params = [];
        
        if ($role === 'analyst') {
            if (empty($sections)) {
                echo json_encode([]);
                exit();
            }
            $placeholders = implode(',', array_fill(0, count($sections), '?'));
            $query .= " WHERE r.category IN ($placeholders)";
            $params = $sections;
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
    }
}

if ($method === 'POST') {
    // Only super_admin and analyst can create reports or add comments
    if ($role === 'viewer') {
        http_response_code(403);
        echo json_encode(["error" => "Viewers cannot create content"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $action = $_GET['action'] ?? 'create_report';

    if ($action === 'create_report') {
        if ($role === 'analyst' && !in_array($data['category'], $sections)) {
            http_response_code(403);
            echo json_encode(["error" => "You cannot create reports for this category"]);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO reports (title, category, config, created_by) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['title'], $data['category'], json_encode($data['config']), $user_id]);
        echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
    } 
    elseif ($action === 'add_comment') {
        $stmt = $pdo->prepare("INSERT INTO analyst_comments (report_id, user_id, comment) VALUES (?, ?, ?)");
        $stmt->execute([$data['report_id'], $user_id, $data['comment']]);
        echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
    }
}
