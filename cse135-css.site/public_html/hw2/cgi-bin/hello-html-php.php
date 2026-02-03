<?php
// Tell the browser this is HTML
header('Content-Type: text/html');

// Team members
$team = ["Christian", "Sophie", "Stefan"];
$teamStr = implode(", ", $team);

// Language name
$language = "PHP";

// Current date-time
$datetime = date('Y-m-d H:i:s');

// User IP
$ip = $_SERVER['REMOTE_ADDR'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hello HTML - PHP</title>
</head>
<body>
    <h1>Hello from our team!</h1>
    <p><strong>Team Members:</strong> <?php echo $teamStr; ?></p>
    <p><strong>Language:</strong> <?php echo $language; ?></p>
    <p><strong>Generated at:</strong> <?php echo $datetime; ?></p>
    <p><strong>Your IP:</strong> <?php echo $ip; ?></p>
</body>
</html>
