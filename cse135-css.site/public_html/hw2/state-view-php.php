#!/usr/bin/php
<?php
session_start();
echo "Content-Type: text/html\r\n\r\n";

$data = $_SESSION['data'] ?? 'No data saved yet';
?>
<!DOCTYPE html>
<html>
<head>
    <title>State View</title>
</head>
<body>
    <h1>Stored Data:</h1>
    <p><?= htmlspecialchars($data) ?></p>
</body>
</html>