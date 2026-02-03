#!/usr/bin/php
<?php
echo "Content-Type: application/json\r\n\r\n";

$response = [
    "server" => $_SERVER,
    "get" => $_GET,
    "post" => $_POST
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
