const METRICS_API_BASE = "/api/metrics";
const LOGIN_API = "/api/login";
const LOGOUT_API = "/api/logout";
const ADMIN_API = "/api/admin/manage_users";

let eventChart = null;

/* ==========================
   AUTHENTICATION LOGIC
========================== */

function showLogin() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'none';
    
    document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const res = await fetch(LOGIN_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            window.location.reload(); // Refresh to trigger showDashboard()
        } else {
            document.getElementById('loginError').innerText = "Invalid username or password";
        }
    };
}

// View Switching Logic
function showView(viewName) {
    document.getElementById('overviewView').style.display = viewName === 'overview' ? 'block' : 'none';
    document.getElementById('adminView').style.display = viewName === 'admin' ? 'block' : 'none';
    
    if (viewName === 'overview') {
        loadMetrics(); // Refresh data when returning to overview
    }
}

// Authentication Gatekeeper
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const checkRes = await fetch(LOGIN_API, { method: 'GET' }); // Check session
        if (checkRes.ok) {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('dashboardContainer').style.display = 'block';
            showView('overview');
            setupAuthHandlers();
        } else {
            document.getElementById('loginContainer').style.display = 'block';
            showLogin();
        }
    } catch (err) {
        document.getElementById('loginContainer').style.display = 'block';
    }
});

// Admin User Creation
function setupAuthHandlers() {
    document.getElementById('logoutBtn').onclick = async () => {
        await fetch(LOGOUT_API, { method: 'POST' });
        window.location.reload();
    };

    document.getElementById('createUserForm').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const msg = document.getElementById('adminMessage');

        try {
            // Target the .htaccess protected directory
            const res = await fetch(ADMIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await res.json();
            if (res.status === 403) {
                msg.style.color = "red";
                msg.innerText = "Error: Access Denied (403)";
            } else if (res.ok) {
                msg.style.color = "green";
                msg.innerText = "Success: " + result.message;
                e.target.reset();
            } else {
                msg.style.color = "red";
                msg.innerText = "Error: " + (result.error || "Forbidden");
            }
        } catch (err) {
            msg.innerText = "Network Error: Could not reach Admin API";
        }
    };
}

/* ==========================
   LOAD METRICS
========================== */

async function loadMetrics() {
  const id = document.getElementById("idFilter").value;
  const type = document.getElementById("typeFilter").value;
  const session = document.getElementById("sessionFilter").value;

  let url = METRICS_API_BASE;
  const params = new URLSearchParams();

  if (type) params.append("type", type);
  if (session) params.append("session", session);

  // Path-based ID for RESTful style, or query params
  if (id) {
    url += `/${id}`;
  } else if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const res = await fetch(url);

    // 1. Check if the server returned an error (like 404)
    if (!res.ok) {
      const errorData = await res.json();
      // Use the 'error' field sent by your PHP (e.g., "Not found")
      alert(`Error ${res.status}: ${errorData.error || 'Request failed'}`);
      return; // Exit the function so we don't try to render
    }

    let data = await res.json();

    // 2. Consistent rendering: Wrap single object in an array
    if (!Array.isArray(data)) {
      data = [data];
    }

    renderTable(data);
    renderChart(data);

  } catch (err) {
    // This catches network failures or JSON parsing errors
    console.error("Fetch error:", err);
    alert("Connection error: Could not reach the reporting server.");
  }
}

/* ==========================
   TABLE RENDER
========================== */

function renderTable(rows) {
  const tbody = document.querySelector("#metricsTable tbody");
  tbody.innerHTML = "";

  rows.forEach(row => {
    const tr = document.createElement("tr");

    const dataCell = document.createElement("td");
    dataCell.appendChild(renderJSON(row.event_data));

    // Added a column at the end for the Delete button
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.session_id}</td>
      <td>${row.event_type}</td>
      <td>${row.page_url || ""}</td>
      <td>${row.page_title || ""}</td>
      <td>${row.referrer || ""}</td>
      <td>${formatDate(row.client_timestamp)}</td>
      <td>${formatDate(row.server_timestamp)}</td>
      <td>${row.ip_address}</td>
    `;

    tr.appendChild(dataCell);
    tbody.appendChild(tr);
  });
}

/* ==========================
   CHART RENDER
========================== */

function renderChart(rows) {

  const counts = {};

  rows.forEach(row => {
    const type = row.event_type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  const ctx = document.getElementById("eventChart");

  if (!ctx) return;

  if (eventChart) {
    eventChart.destroy();
  }

  eventChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Event Count",
        data: values
      }]
    }
  });
}

/* ==========================
   JSON RENDER
========================== */

function renderJSON(jsonString) {
  let data;

  try {
    data = JSON.parse(jsonString);
  } catch {
    const span = document.createElement("span");
    span.textContent = jsonString;
    return span;
  }

  return buildJSONTable(data);
}

function buildJSONTable(obj) {
  const table = document.createElement("table");
  table.className = "json-table";

  Object.entries(obj).forEach(([key, value]) => {
    const row = document.createElement("tr");

    const keyCell = document.createElement("td");
    keyCell.className = "json-key";
    keyCell.textContent = key;

    const valueCell = document.createElement("td");
    valueCell.className = "json-value";

    if (typeof value === "object" && value !== null) {

      const details = document.createElement("details");

      const summary = document.createElement("summary");
      summary.textContent = Array.isArray(value)
        ? `Array (${value.length})`
        : "Object";

      details.appendChild(summary);
      details.appendChild(buildJSONTable(value));

      valueCell.appendChild(details);

    } else {
      valueCell.textContent = value;
    }

    row.appendChild(keyCell);
    row.appendChild(valueCell);

    table.appendChild(row);

  });

  return table;
}

/* ==========================
   DATE FORMATTER
========================== */

function formatDate(ts) {

  if (!ts) return "";

  // Create a Date object. 
  // If ts is a string like "2026-02-28...", Date() will parse it.
  // If it is a number, we apply your existing logic for seconds/milliseconds.
  let date;
  
  if (isNaN(ts)) {
    // Handle string format "2026-02-28 05:49:34"
    date = new Date(ts);
  } else {
    // Handle numeric timestamp logic
    const numericTs = Number(ts);
    const finalTs = numericTs < 10000000000 ? numericTs * 1000 : numericTs;
    date = new Date(finalTs);
  }

  // toLocaleString() provides the "M/D/YYYY, H:MM:SS AM/PM" format by default
  return date.toLocaleString();
}

/* ==========================
   NEW: MODAL & POST FEATURES
========================== */

function openModal(operation = "create") {
  const modal = document.getElementById('metricModal');
  const submitBtn = document.querySelector('.btn-submit');
  const title = document.querySelector('.modal-content h3');

  if (!modal || !submitBtn) return;
  modal.style.display = 'flex';

  // 1. Identify the operation
  const isDelete = (operation === "delete");
  const isUpdate = (operation === "update");
  const isCreate = (operation === "create");

  // 2. Toggle ID field and label (Visible for Update/Delete)
  toggleField('m_id', isUpdate || isDelete);

  // 3. Toggle Data fields and labels (Hidden for Delete)
  const dataFields = ['m_session', 'm_type', 'm_url', 'm_data'];
  dataFields.forEach(id => toggleField(id, !isDelete));

  // 4. Apply Visual Styles and Text
  submitBtn.setAttribute('name', operation);
  if (isCreate) {

    title.textContent = "New Metric Entry";
    submitBtn.textContent = "Create Entry";
    submitBtn.style.backgroundColor = "#28a745"; // Green
    submitBtn.style.color = "#fff"; // Set name attribute for form submission
    document.getElementById('manualForm').reset();
  } 
  else if (isUpdate) {

    title.textContent = "Update Metric Entry";
    submitBtn.textContent = "Update Entry";
    submitBtn.style.backgroundColor = "#ffed29"; // Yellow
    submitBtn.style.color = "#000"; // Black text for readability // Set name attribute for form submission
  }

  else if (isDelete) {

    title.textContent = "Delete Metric Entry";
    submitBtn.textContent = "Delete Entry";
    submitBtn.style.backgroundColor = "#d30000"; // Red
    submitBtn.style.color = "#fff";

  }
}

/**
 * Helper to toggle display of inputs and their specific label IDs
 */
function toggleField(id, show) {

  const field = document.getElementById(id);
  const label = document.getElementById(id + '_label');
  const displayMode = show ? 'block' : 'none';

  if (field) { field.style.display = displayMode; }
  if (label) { label.style.display = displayMode; }
}

function closeModal() {
  const modal = document.getElementById('metricModal');
  if (modal) {
    modal.style.display = 'none';
    const form = document.getElementById('manualForm');
    if (form) form.reset();
  }
}

// Close modal when clicking on the dark background
window.onclick = function(event) {
  const modal = document.getElementById('metricModal');
  if (event.target == modal) closeModal();
}

const manualForm = document.getElementById('manualForm');
if (manualForm) {
  manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector('.btn-submit');
    const operation = submitBtn ? submitBtn.getAttribute('name') : 'create';
    const id = document.getElementById('m_id').value;

    // 1. Basic Validation for ID-dependent operations
    if ((operation === "update" || operation === "delete") && !id) {

      alert(`Please enter an ID to ${operation}.`);
      return;

    }

    // 2. Prepare URL and Method based on REST standards
    let url = METRICS_API_BASE;
    let method = 'POST'; // Default for Create

    if (operation === "update") {
      method = 'PUT';
      url = `${METRICS_API_BASE}/${id}`; // Path-based ID for REST
    } else if (operation === "delete") {
      method = 'DELETE';
      url = `${METRICS_API_BASE}/${id}`; // Path-based ID for REST
    }

    // 3. Prepare Payload (Not needed for DELETE)
    let bodyData = null;

    if (operation !== "delete") {
      const dataInput = document.getElementById('m_data').value;
      let parsedData = {};

      try {

        if (dataInput.trim() !== "") {
          parsedData = JSON.parse(dataInput);
        }
      } catch (err) {
        alert("Invalid JSON format in the Data field.");
        return;

      }

      bodyData = JSON.stringify({
        session_id: document.getElementById('m_session').value,
        event_type: document.getElementById('m_type').value,
        page_url: document.getElementById('m_url').value || window.location.href,
        page_title: operation === "update" ? "Manual Update" : "Manual Entry",
        client_timestamp: Math.floor(Date.now() / 1000),
        event_data: parsedData
      });

    }

    // 4. Execute Request
    try {

      const options = {

        method: method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (bodyData) options.body = bodyData;

      const res = await fetch(url, options);

      if (res.ok) {

        alert(`Metric ${operation}d successfully!`);

        closeModal();
        loadMetrics(); // Refresh the table
      } else {
        const errorData = await res.json();
        alert("Error: " + (errorData.error || `Failed to ${operation}`));
      }
    } catch (err) {
        console.error("Fetch error:", err);
      alert("Could not connect to the API.");
    }
  });
}