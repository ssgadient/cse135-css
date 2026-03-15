<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/* =============================
   AUTHENTICATION & AUTHORIZATION CHECK
============================= */
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized access. Please log in."]);
    exit();
}

$role = $_SESSION['role'] ?? 'viewer';
$sections = $_SESSION['sections'] ?? [];

// Viewer cannot access raw metrics directly, only saved reports
if ($role === 'viewer') {
    http_response_code(403);
    echo json_encode(["error" => "Access denied. Viewers can only access saved reports."]);
    exit();
}

/* =============================
   LOAD DATABASE CONFIG
============================= */

$configPath = __DIR__ . '/../../db_config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database configuration missing",
        "hint" => "Create db_config.php from db_config.dummy.php"
    ]);
    exit();
}

$config = include($configPath);

/* =============================
   CONNECT DATABASE (PDO)
============================= */

try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4",
        $config['user'],
        $config['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

/* =============================
   HELPERS
============================= */

function jsonBody() {
    return json_decode(file_get_contents("php://input"), true);
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

$method  = $_SERVER['REQUEST_METHOD'];
$id      = $_GET['id'] ?? null;
$type    = $_GET['type'] ?? null;
$session = $_GET['session'] ?? null;


/* =============================
   GET
============================= */

if ($method === "GET") {

    $query = "SELECT * FROM metric_logs";
    $conditions = [];
    $params = [];

    // filter by row id
    if ($id !== null) {
        $conditions[] = "id = ?";
        $params[] = $id;
    }

    // filter by event type
    if ($type !== null) {
        $conditions[] = "event_type = ?";
        $params[] = $type;
    }

    // filter by session
    if ($session !== null) {
        $conditions[] = "session_id = ?";
        $params[] = $session;
    }

    if ($conditions) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }

    $query .= " ORDER BY server_timestamp DESC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    $results = $stmt->fetchAll();

    // If querying specific ID, return single object
    if ($id !== null) {
        if (count($results) === 0)
            respond(["error"=>"Fetch failed. Could not find metric with ID: $id"],404);

        respond($results[0]);
    }

    respond($results);
}


/* =============================
   POST
============================= */

if ($method === "POST") {
    $data = jsonBody();

    if (!is_array($data)) {
        respond(["error" => "Invalid JSON provided"], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO metric_logs 
        (session_id, event_type, page_url, page_title, referrer, client_timestamp, event_data, ip_address) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    try {
        // Remove (int) casting. Let PHP pass the large numeric string directly.
        // We still use ?? 0 to ensure we don't pass a NULL to a column that might not like it.
        $clientTs = $data['client_timestamp'] ?? 0;

        $stmt->execute([
            $data['session_id'] ?? 'unknown',          
            $data['event_type'] ?? 'general',          
            $data['page_url'] ?? null,                
            $data['page_title'] ?? null,               
            $data['referrer'] ?? null,                 
            $clientTs, // PDO will handle this large number correctly now
            json_encode($data['event_data'] ?? []),    
            
            $_SERVER['REMOTE_ADDR']                    
        ]);
        
        respond([
            "message" => "Inserted successfully",
            "id" => $pdo->lastInsertId()
        ], 201);

    } catch (PDOException $e) {
        respond(["error" => "DB Error: " . $e->getMessage()], 500);
    }
}


/* =============================
   PUT
============================= */

if ($method === "PUT") {

    if (!$id)
        respond(["error"=>"ID required"],400);

    $data = jsonBody();

    $stmt = $pdo->prepare("
        UPDATE metric_logs
        SET event_type = ?, event_data = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $data['event_type'],
        json_encode($data['event_data'] ?? []),
        $id
    ]);

    if ($stmt->rowCount() === 0)
        respond(["error"=>"Not found"],404);

    respond(["message"=>"Updated successfully"]);
}


/* =============================
   DELETE
============================= */

if ($method === "DELETE") {
    if ($id === null) {
        respond(["error" => "ID is required for deletion"], 400);
    }

    $query = "DELETE FROM metric_logs WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            respond(["error" => "Metric with ID $id not found"], 404);
        }

        respond(["message" => "Metric $id deleted successfully"]);

    } catch (PDOException $e) {
        respond(["error" => "DB Error: " . $e->getMessage()], 500);
    }
}