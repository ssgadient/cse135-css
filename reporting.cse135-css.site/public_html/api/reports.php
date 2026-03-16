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
            // Fetch specific report and its creator
            $stmt = $pdo->prepare("SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id WHERE r.id = ?");
            $stmt->execute([$report_id]);
            $report = $stmt->fetch();
            
            if (!$report) {
                http_response_code(404);
                echo json_encode(["error" => "Report not found"]);
                exit();
            }

            // Fetch metrics data based on the report's config
            $config = json_decode($report['config'], true);
            $typeFilter = $config['type'] ?? null;
            $sessionFilter = $config['session'] ?? null;

            $mQuery = "SELECT * FROM metric_logs";
            $mConds = [];
            $mParams = [];

            if ($typeFilter) {
                $mConds[] = "event_type = ?";
                $mParams[] = $typeFilter;
            }
            if ($sessionFilter) {
                $mConds[] = "session_id = ?";
                $mParams[] = $sessionFilter;
            }

            // STATIC SNAPSHOT: Only fetch data that existed when the report was created
            $mConds[] = "server_timestamp <= ?";
            $mParams[] = $report['created_at'];

            // If it's a category-wide report with no specific filters, we filter by the category's mapped types
            // This ensures the report only shows what it's supposed to
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

            if ($mConds) {
                $mQuery .= " WHERE " . implode(" AND ", $mConds);
            }
            $mQuery .= " ORDER BY server_timestamp DESC LIMIT 1000";

            $mStmt = $pdo->prepare($mQuery);
            $mStmt->execute($mParams);
            $report['data'] = $mStmt->fetchAll();

            // Fetch comments
            $stmt = $pdo->prepare("SELECT c.*, u.username FROM analyst_comments c JOIN users u ON c.user_id = u.id WHERE c.report_id = ? ORDER BY c.created_at DESC");
            $stmt->execute([$report_id]);
            $report['comments'] = $stmt->fetchAll();
            
            echo json_encode($report);
        } else {
            // Fetch all reports accessible to user
            $query = "SELECT r.*, u.username as creator_name FROM reports r JOIN users u ON r.created_by = u.id";
            $params = [];
            
            // AUTHORIZATION: All authenticated users can see the full list of reports.
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
        else if ($action === 'add_comment') {
            $stmt = $pdo->prepare("INSERT INTO analyst_comments (report_id, user_id, comment) VALUES (?, ?, ?)");
            $stmt->execute([$data['report_id'], $user_id, $data['comment']]);
            echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Server Error: " . $e->getMessage()]);
}
