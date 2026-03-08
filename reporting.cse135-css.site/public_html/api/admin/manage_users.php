<?php
// reporting.cse135-css.site/public_html/api/admin/manage_users.php
session_start();
header("Content-Type: application/json");

// 1. Session check for extra security (MVC standard)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$config = include('../db_config.php');

try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4", $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        $new_user = $data['username'] ?? '';
        $new_pass = $data['password'] ?? '';

        if (empty($new_user) || empty($new_pass)) {
            throw new Exception("Username and password required");
        }

        // Securely hash the password before inserting
        $hash = password_hash($new_pass, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->execute([$new_user, $hash]);

        echo json_encode(["status" => "success", "message" => "User $new_user created"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}