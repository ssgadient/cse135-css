<?php
header('Content-Type: application/json');

$data = array_merge($_GET, $_POST);
echo json_encode($data, JSON_PRETTY_PRINT);
