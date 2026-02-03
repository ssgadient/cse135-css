#!/usr/bin/php
<?php
echo "Content-Type: application/json\r\n\r\n";

$response = [
    "greeting" => "Hello from Team XYZ",
    "language" => "PHP",
    "datetime" => date('Y-m-d H:i:s'),
    "ip" => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

echo json_encode($response);
