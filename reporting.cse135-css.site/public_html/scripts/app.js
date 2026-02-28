const API_BASE = "/api/metrics";

async function loadMetrics() {
  const id = document.getElementById("idFilter").value;
  const type = document.getElementById("typeFilter").value;
  const session = document.getElementById("sessionFilter").value;

  let url = API_BASE;
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

  } catch (err) {
    // This catches network failures or JSON parsing errors
    console.error("Fetch error:", err);
    alert("Connection error: Could not reach the reporting server.");
  }
}

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
      <td>
        <button class="delete-btn" onclick="deleteMetric(${row.id})">
          Delete
        </button>
      </td>
    `;

    tr.appendChild(dataCell);
    tbody.appendChild(tr);
  });
}

/* ==========================
   JSON → TABLE RENDERER
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

function formatDate(ts) {
  if (!ts) return "";

  // Convert string to number if necessary
  const numericTs = Number(ts);

  // If the number is small (10 digits), it's in seconds. 
  // We multiply by 1000 to get milliseconds for JavaScript.
  const finalTs = numericTs < 10000000000 ? numericTs * 1000 : numericTs;
  return new Date(finalTs).toLocaleString();
}

loadMetrics();

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
  if (isCreate) {
    title.textContent = "New Metric Entry";
    submitBtn.textContent = "Save to Database";
    submitBtn.style.backgroundColor = "#28a745"; // Green
    submitBtn.style.color = "#fff";
    document.getElementById('manualForm').reset();
  } 
  else if (isUpdate) {
    title.textContent = "Update Metric Entry";
    submitBtn.textContent = "Update Entry";
    submitBtn.style.backgroundColor = "#ffed29"; // Yellow
    submitBtn.style.color = "#000"; // Black text for readability
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

  if (field) {
    field.style.display = displayMode;
    // Only require fields that are visible and necessary for the DB
    field.required = show && (id !== 'm_url' && id !== 'm_data'); 
  }
  if (label) {
    label.style.display = displayMode;
  }
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

// Handle Manual Form Submission
const manualForm = document.getElementById('manualForm');
if (manualForm) {
  manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataInput = document.getElementById('m_data').value;
    let parsedData = {};

    // Validate JSON input
    try {
      if (dataInput.trim() !== "") {
        parsedData = JSON.parse(dataInput);
      }
    } catch (err) {
      alert("Invalid JSON format in the Data field. Example: {\"x\": 10, \"y\": 20}");
      return;
    }

    const payload = {
      session_id: document.getElementById('m_session').value,
      event_type: document.getElementById('m_type').value,
      page_url: document.getElementById('m_url').value || window.location.href,
      page_title: "Manual Entry",
      client_timestamp: Math.floor(Date.now() / 1000),
      event_data: parsedData
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Metric saved successfully!");
        closeModal();
        loadMetrics(); // Refreshes the table
      } else {
        const errorData = await res.json();
        alert("Error: " + (errorData.error || "Failed to save"));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Could not connect to the API. Check your API_BASE.");
    }
  });
}

/* ==========================
   DELETE FUNCTIONALITY
========================== */

async function deleteMetric(id) {
  // 1. Confirm with the user
  if (!confirm(`Are you sure you want to delete entry #${id}?`)) return;

  try {
    // 2. Send DELETE request to your REST endpoint
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      // 3. Refresh the table if successful
      loadMetrics();
    } else {
      const errorData = await res.json();
      alert("Error: " + (errorData.error || "Failed to delete"));
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Could not reach the server to delete.");
  }
}