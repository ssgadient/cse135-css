<?php
header("Content-Type: application/json");
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$configPath = __DIR__ . '/../../db_config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(["error" => "Database configuration missing"]);
    exit();
}
$config = include($configPath);

try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4", $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $method = $_SERVER['REQUEST_METHOD'];
    $role = $_SESSION['role'];
    $user_id = $_SESSION['user_id'];
    $sections = $_SESSION['sections'] ?? [];

    if ($method === 'GET') {
        $report_id = $_GET['id'] ?? null;
        
        if ($report_id) {
            // 1. Fetch specific report metadata
            $stmt = $pdo->prepare("SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id WHERE r.id = ?");
            $stmt->execute([$report_id]);
            $report = $stmt->fetch();
            
            if (!$report) {
                http_response_code(404);
                echo json_encode(["error" => "Report not found"]);
                exit();
            }

            // AUTHORIZATION: All authenticated users (Admins, Analysts, Viewers) can view any saved report.
            
            // 2. Fetch metrics data snapshot for this report
            $config = json_decode($report['config'], true);
            $typeFilter = $config['type'] ?? null;
            $sessionFilter = $config['session'] ?? null;

            $mQuery = "SELECT * FROM metric_logs";
            $mConds = ["server_timestamp <= ?"]; // Static Snapshot Logic
            $mParams = [$report['created_at']];

            if ($typeFilter) {
                $mConds[] = "event_type = ?";
                $mParams[] = $typeFilter;
            }
            if ($sessionFilter) {
                $mConds[] = "session_id = ?";
                $mParams[] = $sessionFilter;
            }

            // If no specific type filter, use the category mapping
            if (!$typeFilter) {
                $sectionMapping = [
                    'performance' => ['performance', 'static', 'enter', 'exit', 'load', 'fcp', 'lcp', 'fid', 'cls', 'ttfb'],
                    'behavioral'  => ['click', 'scroll', 'mousemove', 'keydown', 'keyup', 'idle_start', 'idle_end', 'input', 'hover', 'submit'],
                    'errors'      => ['js-error', 'promise-rejection', 'resource-error', '404-error', 'api-error']
                ];
                if (isset($sectionMapping[$report['category']])) {
                    $allowed = $sectionMapping[$report['category']];
                    $placeholders = implode(',', array_fill(0, count($allowed), '?'));
                    $mConds[] = "event_type IN ($placeholders)";
                    $mParams = array_merge($mParams, $allowed);
                }
            }

            $mQuery .= " WHERE " . implode(" AND ", $mConds) . " ORDER BY server_timestamp DESC LIMIT 1000";
            $mStmt = $pdo->prepare($mQuery);
            $mStmt->execute($mParams);
            $report['data'] = $mStmt->fetchAll();

            // 3. Fetch comments
            $stmt = $pdo->prepare("SELECT c.*, u.username FROM analyst_comments c JOIN users u ON c.user_id = u.id WHERE c.report_id = ? ORDER BY c.created_at DESC");
            $stmt->execute([$report_id]);
            $report['comments'] = $stmt->fetchAll();
            
            echo json_encode($report);
        } else {
            // Fetch list of all reports
            $query = "SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id ORDER BY r.created_at DESC";
            $stmt = $pdo->query($query);
            echo json_encode($stmt->fetchAll());
        }
    }

    if ($method === 'POST') {
        if ($role === 'viewer') {
            http_response_code(403);
            echo json_encode(["error" => "Viewers cannot create content"]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $action = $_GET['action'] ?? 'create_report';

        if ($action === 'create_report') {
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

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server Error: " . $e->getMessage()]);
}
