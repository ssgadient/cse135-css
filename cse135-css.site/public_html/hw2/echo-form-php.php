#!/usr/bin/php
<?php
echo "Content-Type: text/html\r\n\r\n";

$name = $_POST['name'] ?? '';
$message = $_POST['message'] ?? '';
?>
<!DOCTYPE html>
<html>
<head>
    <title>Echo Form</title>
</head>
<body>
    <form method="post">
        Name: <input type="text" name="name"><br>
        Message: <input type="text" name="message"><br>
        <input type="submit" value="Send">
    </form>

    <?php if ($name || $message): ?>
        <h2>Echo:</h2>
        <p>Name: <?= htmlspecialchars($name) ?></p>
        <p>Message: <?= htmlspecialchars($message) ?></p>
    <?php endif; ?>
</body>
</html>