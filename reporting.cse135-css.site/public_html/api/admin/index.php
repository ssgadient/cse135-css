<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'super_admin') {
    http_response_code(403);
    include('../../error_pages/403.html');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin - User Management</title>
  <link rel="stylesheet" href="../../style/index.css">
  <link rel="stylesheet" href="../../style/admin_style.css">
</head>
<body>
  <header style="background: #1f2937; padding: 20px; display: flex; align-items: center;">
    <button onclick="window.location.href='/'" style="padding: 8px 15px; cursor: pointer; border-radius: 4px; border: none; background: #6c757d; color: white;">&larr; Back to Dashboard</button>
    <h2 style="color: white; margin: 0 0 0 20px;">Admin Panel - User Management</h2>
  </header>

  <div class="admin-container">
    <div class="user-list">
        <h3>Existing Users</h3>
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Sections</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="userTableBody"></tbody>
        </table>
    </div>

    <div class="user-form admin-card" style="margin: 0;">
        <h3 id="formTitle">Create New User</h3>
        <form id="userForm">
            <input type="hidden" id="userId">
            <label for="newUsername">Username:</label>
            <input type="text" id="newUsername" placeholder="Username" required>
            
            <label for="newPassword">Password:</label>
            <input type="password" id="newPassword" placeholder="Password (leave blank to keep current)">
            
            <label for="newRole">User Role:</label>
            <select id="newRole" style="width: 100%; padding: 10px; margin: 10px 0; border-radius: 4px; border: 1px solid #ddd;">
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="super_admin">Super Admin</option>
            </select>

            <div id="analystSections" style="display:none;">
                <p>Analyst Access Sections:</p>
                <div class="section-checkbox-group">
                    <label><input type="checkbox" name="section" value="performance"> Performance</label>
                    <label><input type="checkbox" name="section" value="behavioral"> Behavioral</label>
                    <label><input type="checkbox" name="section" value="errors"> Errors</label>
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="submit" id="submitBtn" style="flex: 2;">Add User</button>
                <button type="button" id="cancelBtn" style="flex: 1; background: #6b7280; display: none;">Cancel</button>
            </div>
        </form>
        <div id="adminMessage" style="margin-top: 15px; font-weight: bold;"></div>
    </div>
  </div>

  <script>
    const userForm = document.getElementById('userForm');
    const roleSelect = document.getElementById('newRole');
    const sectionsDiv = document.getElementById('analystSections');
    const userTableBody = document.getElementById('userTableBody');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    roleSelect.onchange = () => {
        sectionsDiv.style.display = (roleSelect.value === 'analyst') ? 'block' : 'none';
    };

    async function loadUsers() {
        const res = await fetch('manage_users.php');
        const users = await res.json();
        userTableBody.innerHTML = users.map(u => `
            <tr>
                <td>${u.username}</td>
                <td><span class="badge badge-${u.role.replace('_', '-')}">${u.role}</span></td>
                <td><small>${u.sections.join(', ') || 'None'}</small></td>
                <td>
                    <button class="btn-edit" onclick="editUser(${u.id}, '${u.username}', '${u.role}', ${JSON.stringify(u.sections).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-delete" onclick="deleteUser(${u.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    function editUser(id, username, role, sections) {
        document.getElementById('userId').value = id;
        document.getElementById('newUsername').value = username;
        document.getElementById('newRole').value = role;
        document.getElementById('newPassword').placeholder = "Update Password (optional)";
        document.getElementById('newPassword').required = false;
        
        // Check checkboxes
        document.querySelectorAll('input[name="section"]').forEach(cb => {
            cb.checked = sections.includes(cb.value);
        });
        
        sectionsDiv.style.display = (role === 'analyst') ? 'block' : 'none';
        
        formTitle.innerText = "Edit User: " + username;
        submitBtn.innerText = "Update User";
        cancelBtn.style.display = "block";
    }

    cancelBtn.onclick = resetForm;

    function resetForm() {
        userForm.reset();
        document.getElementById('userId').value = "";
        formTitle.innerText = "Create New User";
        submitBtn.innerText = "Add User";
        cancelBtn.style.display = "none";
        document.getElementById('newPassword').placeholder = "Password";
        document.getElementById('newPassword').required = true;
        sectionsDiv.style.display = 'none';
    }

    userForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const selectedSections = Array.from(document.querySelectorAll('input[name="section"]:checked')).map(cb => cb.value);
        
        const payload = {
            id: id || null,
            username: document.getElementById('newUsername').value,
            password: document.getElementById('newPassword').value,
            role: roleSelect.value,
            sections: selectedSections
        };

        const res = await fetch('manage_users.php', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        document.getElementById('adminMessage').innerText = res.ok ? "Success!" : "Error: " + (result.error || "Failed");
        if (res.ok) {
            resetForm();
            loadUsers();
        }
    };

    async function deleteUser(id) {
        if (!confirm("Are you sure you want to delete this user?")) return;
        const res = await fetch(`manage_users.php?id=${id}`, { method: 'DELETE' });
        if (res.ok) loadUsers();
    }

    loadUsers();
  </script>
</body>
</html>
