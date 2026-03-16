<?php
session_start();

// Centralized Routing Logic
if (!isset($_SESSION['user_id'])) {
    // Not logged in -> Show login UI
    include('login_ui.html');
    exit();
}

$role = $_SESSION['role'] ?? 'viewer';

if ($role === 'viewer') {
    // Viewers only see saved reports
    header("Location: /reports");
} else {
    // Admins and Analysts see live metrics by default
    header("Location: /metrics");
}
exit();
