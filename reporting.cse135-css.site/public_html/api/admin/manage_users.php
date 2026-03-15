<?php
// reporting.cse135-css.site/public_html/api/admin/manage_users.php
session_start();
header("Content-Type: application/json");

// Protected by .htaccess Basic Auth in the /api/admin directory

$configPath = __DIR__ . '/../../../db_config.php';
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

    /* =============================
       READ (GET)
    ============================= */
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, username, role, sections, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        // Decode sections JSON for frontend
        foreach ($users as &$u) {
            $u['sections'] = json_decode($u['sections'] ?? '[]', true);
        }
        echo json_encode($users);
        exit();
    }

    /* =============================
       CREATE (POST)
    ============================= */
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $new_user = $data['username'] ?? '';
        $new_pass = $data['password'] ?? '';
        $role     = $data['role'] ?? 'viewer';
        $sections = $data['sections'] ?? [];

        if (empty($new_user) || empty($new_pass)) {
            http_response_code(400);
            echo json_encode(["error" => "Username and password required"]);
            exit();
        }

        $hash = password_hash($new_pass, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role, sections) VALUES (?, ?, ?, ?)");
        $stmt->execute([$new_user, $hash, $role, json_encode($sections)]);

        echo json_encode(["status" => "success", "message" => "User created"]);
        exit();
    }

    /* =============================
       UPDATE (PUT)
    ============================= */
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id       = $data['id'] ?? null;
        $username = $data['username'] ?? '';
        $role     = $data['role'] ?? 'viewer';
        $sections = $data['sections'] ?? [];
        $password = $data['password'] ?? ''; // Optional update

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "User ID required"]);
            exit();
        }

        if ($password) {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET username = ?, password_hash = ?, role = ?, sections = ? WHERE id = ?");
            $stmt->execute([$username, $hash, $role, json_encode($sections), $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET username = ?, role = ?, sections = ? WHERE id = ?");
            $stmt->execute([$username, $role, json_encode($sections), $id]);
        }

        echo json_encode(["status" => "success", "message" => "User updated"]);
        exit();
    }

    /* =============================
       DELETE (DELETE)
    ============================= */
    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "User ID required"]);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(["status" => "success", "message" => "User deleted"]);
        exit();
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
