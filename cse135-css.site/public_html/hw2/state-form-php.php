<?php
session_start();
header('Content-Type: application/json');

foreach ($_REQUEST as $key => $value) {
  $_SESSION[$key] = $value;
}

echo json_encode([
  "message" => "State saved",
  "state" => $_SESSION
], JSON_PRETTY_PRINT);
