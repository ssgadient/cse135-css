#!/usr/bin/php
<?php
session_start();
echo "Content-Type: text/html\r\n\r\n";

if (isset($_POST['data'])) {
    $_SESSION['data'] = $_POST['data'];
}
$data = $_SESSION['data'] ?? '';
?>
<!DOCTYPE html>
<html>
<head>
    <title>State Form</title>
</head>
<body>
    <form method="post">
        Data: <input type="text" name="data" value="<?= htmlspecialchars($data) ?>">
        <input type="submit" value="Save">
    </form>
    <?php if ($data): ?>
        <p>Stored Data: <?= htmlspecialchars($data) ?></p>
    <?php endif; ?>
</body>
</html>

