<?php
session_start();
header("Content-Type: application/json");

// Load Database Config
$configPath = __DIR__ . '../../db_config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(["error" => "Configuration missing"]);
    exit();
}
$config = include($configPath);

// Connect to DB
try {
    $pdo = new PDO("mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4", $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Handle Login
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $pdo->prepare("SELECT id, password_hash FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        // Prevent session fixation attacks
        session_regenerate_id(true); 
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        
        echo json_encode(["status" => "success", "message" => "Logged in successfully"]);
        http_response_code(200);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
    }
    exit();
}

// Check Current Auth Status (Useful for your SPA frontend)
if ($method === 'GET') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode(["authenticated" => true, "username" => $_SESSION['username']]);
    } else {
        http_response_code(401);
        echo json_encode(["authenticated" => false]);
    }
    exit();
}