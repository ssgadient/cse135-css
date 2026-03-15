const METRICS_API_BASE = "/api/metrics";
const REPORTS_API = "/api/reports.php";
const LOGIN_API = "/api/login";
const LOGOUT_API = "/api/logout";
const ADMIN_API = "/api/admin/manage_users";

let eventChart = null;
let timeChart = null;
let referrerChart = null;
let sessionChart = null;
let reportChart = null;

let currentUser = null;
let currentReportId = null;

/* ==========================
   AUTHENTICATION LOGIC
========================== */

function toggleView(isAuthenticated, user = null) {
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    
    if (isAuthenticated && user) {
        currentUser = user;
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        applyRolePermissions(user);
    } else {
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
    }
}

function applyRolePermissions(user) {
    const isAdmin = user.role === 'super_admin';
    const isAnalyst = user.role === 'analyst';
    const isViewer = user.role === 'viewer';

    document.getElementById('adminBtn').style.display = isAdmin ? 'inline-block' : 'none';
    
    // Viewer cannot see Metrics raw view, only Reports
    if (isViewer) {
        showView('reports');
        const metricsNavBtn = document.querySelector('button[onclick="showView(\'metrics\')"]');
        if (metricsNavBtn) metricsNavBtn.style.display = 'none';
    } else {
        showView('metrics');
    }

    // Hide metric modification buttons for viewers
    const modificationBtns = ['addMetricBtn', 'updateMetricBtn', 'deleteMetricBtn', 'saveReportBtn'];
    modificationBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = isViewer ? 'none' : 'inline-block';
    });

    // Hide comment form for viewers
    const commentForm = document.getElementById('addCommentForm');
    if (commentForm) commentForm.style.display = isViewer ? 'none' : 'block';
}

function showView(viewName) {
    const metricsView = document.getElementById('metricsView');
    const reportsView = document.getElementById('reportsView');
    
    if (viewName === 'metrics') {
        metricsView.style.display = 'block';
        reportsView.style.display = 'none';
        loadMetrics();
    } else {
        metricsView.style.display = 'none';
        reportsView.style.display = 'block';
        loadReports();
    }
}

async function loadReports() {
    try {
        const res = await fetch(REPORTS_API);
        const reports = await res.json();
        renderReportsList(reports);
    } catch (err) {
        console.error("Failed to load reports:", err);
    }
}

function renderReportsList(reports) {
    const list = document.getElementById('reportsList');
    list.innerHTML = "";
    
    if (reports.length === 0) {
        list.innerHTML = "<p>No reports available.</p>";
        return;
    }

    reports.forEach(report => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.style.cursor = 'pointer';
        card.style.padding = '15px';
        card.innerHTML = `
            <h3>${report.title}</h3>
            <p>Category: ${report.category}</p>
            <p>Created by: ${report.creator_name}</p>
            <p>Date: ${new Date(report.created_at).toLocaleDateString()}</p>
        `;
        card.onclick = () => loadReportDetails(report.id);
        list.appendChild(card);
    });
}

async function loadReportDetails(id) {
    currentReportId = id;
    try {
        const res = await fetch(`${REPORTS_API}?id=${id}`);
        const report = await res.json();
        
        document.getElementById('selectedReport').style.display = 'block';
        document.getElementById('reportTitle').innerText = report.title;
        
        // Load data for the report based on its config
        const config = JSON.parse(report.config);
        const params = new URLSearchParams(config);
        const dataRes = await fetch(`${METRICS_API_BASE}?${params.toString()}`);
        const data = await dataRes.json();
        
        renderReportChart(data);
        renderComments(report.comments);
        
        // Scroll to the report details
        document.getElementById('selectedReport').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("Failed to load report details:", err);
    }
}

function renderReportChart(data) {
    const counts = {};
    data.forEach(row => {
        const type = row.event_type || "unknown";
        counts[type] = (counts[type] || 0) + 1;
    });

    const ctx = document.getElementById("reportChart");
    if (reportChart) reportChart.destroy();

    reportChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Event Distribution",
                data: Object.values(counts),
                backgroundColor: '#8b5cf6'
            }]
        }
    });
}

function renderComments(comments) {
    const list = document.getElementById('commentsList');
    list.innerHTML = "";
    
    comments.forEach(c => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid #eee';
        div.innerHTML = `
            <strong>${c.username}</strong> <small>${new Date(c.created_at).toLocaleString()}</small>
            <p>${c.comment}</p>
        `;
        list.appendChild(div);
    });
}

async function submitComment() {
    const text = document.getElementById('commentText').value;
    if (!text || !currentReportId) return;

    try {
        const res = await fetch(`${REPORTS_API}?action=add_comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: currentReportId, comment: text })
        });

        if (res.ok) {
            document.getElementById('commentText').value = "";
            loadReportDetails(currentReportId);
        }
    } catch (err) {
        console.error("Failed to submit comment:", err);
    }
}

function openReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('saveReportForm').reset();
}

document.getElementById('saveReportForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('report_title').value;
    const category = document.getElementById('report_category').value;
    
    // Use current filters as config
    const config = {
        type: document.getElementById("typeFilter").value,
        session: document.getElementById("sessionFilter").value
    };

    try {
        const res = await fetch(`${REPORTS_API}?action=create_report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category, config })
        });

        if (res.ok) {
            alert("Report saved successfully!");
            closeReportModal();
            showView('reports');
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    } catch (err) {
        console.error("Failed to save report:", err);
    }
};

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
            const user = await res.json();
            toggleView(true, user);
            setupLogoutHandler();
        } else {
            document.getElementById('loginError').innerText = "Invalid username or password";
        }
    };
}

// Authentication Gatekeeper
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const checkRes = await fetch(LOGIN_API, { method: 'GET' }); // Check session
        if (checkRes.ok) {
            const user = await checkRes.json();
            toggleView(true, user);
            setupLogoutHandler(); // Setup logout handler
        } else {
            toggleView(false);
            showLogin();
        }
    } catch (err) {
        document.getElementById('loginContainer').style.display = 'block';
    }
});

// Logout Handler
function setupLogoutHandler() {
    document.getElementById('logoutBtn').onclick = async () => {
        await fetch(LOGOUT_API, { method: 'POST' });
        window.location.reload();
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
      return;
    }

    let data = await res.json();

    // 2. Consistent rendering: Wrap single object in an array
    if (!Array.isArray(data)) {
      data = [data];
    }

    renderTable(data);
    renderEventChart(data);
    renderTimeChart(data);
    renderReferrerChart(data);
    renderSessionChart(data);

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
   CHARTS
========================== */

function renderEventChart(rows) {

  const counts = {};

  rows.forEach(row => {
    const type = row.event_type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  const ctx = document.getElementById("eventChart");

  if (!ctx) return;

  if (eventChart) eventChart.destroy();

  eventChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Event Count",
        data: Object.values(counts)
      }]
    }
  });
}

function renderTimeChart(rows) {

  const counts = {};

  rows.forEach(row => {

    const time = new Date(row.server_timestamp).toLocaleTimeString();

    counts[time] = (counts[time] || 0) + 1;

  });

  const ctx = document.getElementById("timeChart");
  if (!ctx) return;

  if (timeChart) timeChart.destroy();

  timeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Events Over Time",
        data: Object.values(counts)
      }]
    }
  });
}

function renderReferrerChart(rows) {

  const counts = {};

  rows.forEach(row => {

    const ref = row.referrer || "Direct";

    counts[ref] = (counts[ref] || 0) + 1;

  });

  const ctx = document.getElementById("referrerChart");
  if (!ctx) return;

  if (referrerChart) referrerChart.destroy();

  referrerChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: "Referrers",
        data: Object.values(counts)
      }]
    }
  });
}

function renderSessionChart(rows) {

  const counts = {};

  rows.forEach(row => {

    const session = row.session_id || "unknown";

    counts[session] = (counts[session] || 0) + 1;

  });

  const ctx = document.getElementById("sessionChart");
  if (!ctx) return;

  if (sessionChart) sessionChart.destroy();

  sessionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(counts).slice(0,10),
      datasets: [{
        label: "Events per Session",
        data: Object.values(counts).slice(0,10)
      }]
    }
  });
}

/* ==========================
   JSON + DATE UTILITIES
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

  Object.entries(obj).forEach(([key,value]) => {

    const row = document.createElement("tr");

    const keyCell = document.createElement("td");
    keyCell.textContent = key;

    const valueCell = document.createElement("td");

    if (typeof value === "object" && value !== null) {

      const details = document.createElement("details");
      const summary = document.createElement("summary");

      summary.textContent = Array.isArray(value) ? `Array (${value.length})` : "Object";

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
   PDF EXPORT
========================== */
window.exportPDF = async function () {
    const container = document.createElement("div");
    container.style.width = "1050px"; 
    container.style.margin = "0 auto";
    container.style.background = "white";
    container.style.fontFamily = "Arial, sans-serif";

    // Detect which view is active
    const isMetricsView = document.getElementById('metricsView').style.display !== 'none';
    const isReportsView = document.getElementById('reportsView').style.display !== 'none';

    const createPage = (titleText) => {
        const section = document.createElement("div");
        section.style.padding = "20px 30px";
        section.style.pageBreakAfter = "always"; 
        section.style.display = "flex";
        section.style.flexDirection = "column";
        section.style.alignItems = "center";

        const header = document.createElement("h2");
        header.textContent = titleText;
        header.style.margin = "0 0 10px 0";
        section.appendChild(header);
        return section;
    };

    /* ===== LOGIC FOR RAW METRICS VIEW ===== */
    if (isMetricsView) {
        const chartConfigs = [
            { obj: eventChart, name: "Event Distribution" },
            { obj: timeChart, name: "Events Over Time" },
            { obj: referrerChart, name: "Top Referrers" },
            { obj: sessionChart, name: "Session Activity" }
        ];

        // Charts: 2 per page
        for (let i = 0; i < chartConfigs.length; i += 2) {
            const page = createPage(`Metrics Charts ${i+1}-${i+2}`);
            [chartConfigs[i], chartConfigs[i+1]].forEach(config => {
                if (config && config.obj) {
                    const img = document.createElement("img");
                    img.src = config.obj.toBase64Image();
                    img.style.width = "80%"; 
                    img.style.marginBottom = "20px";
                    page.appendChild(img);
                }
            });
            container.appendChild(page);
        }

        // Table: High Density (30 Rows)
        const table = document.getElementById("metricsTable");
        if (table && table.querySelector('tbody tr')) {
            const tablePage = createPage("Metrics Data Preview (30 Rows)");
            const preview = table.cloneNode(true);
            const rows = preview.querySelectorAll("tbody tr");
            rows.forEach((row, i) => { if (i > 29) row.remove(); });

            preview.style.width = "100%";
            preview.style.borderCollapse = "collapse";
            preview.style.fontSize = "8px"; 
            preview.style.tableLayout = "fixed"; 

            preview.querySelectorAll("th, td").forEach(cell => {
                cell.style.border = "1px solid #ccc";
                cell.style.padding = "4px 2px";
                cell.style.wordBreak = "break-all";
                cell.style.overflow = "hidden";
            });
            tablePage.appendChild(preview);
            container.appendChild(tablePage);
        }
    } 

    /* ===== LOGIC FOR SAVED REPORTS VIEW ===== */
    else if (isReportsView) {
        const reportTitle = document.getElementById('reportTitle').innerText;
        const selectedReport = document.getElementById('selectedReport');

        if (selectedReport.style.display !== 'none') {
            const page = createPage(`Report: ${reportTitle}`);
            
            // 1. Capture the specific Report Chart
            if (reportChart) {
                const img = document.createElement("img");
                img.src = reportChart.toBase64Image();
                img.style.width = "90%";
                img.style.border = "1px solid #eee";
                page.appendChild(img);
            }

            // 2. Capture Comments
            const commentsDiv = document.getElementById('commentsList').cloneNode(true);
            const commentHeader = document.createElement("h3");
            commentHeader.innerText = "Analyst Comments";
            commentHeader.style.marginTop = "30px";
            
            page.appendChild(commentHeader);
            page.appendChild(commentsDiv);
            container.appendChild(page);
        } else {
            // If viewing the list of reports but none selected
            const page = createPage("Available Saved Reports");
            const listClone = document.getElementById('reportsList').cloneNode(true);
            page.appendChild(listClone);
            container.appendChild(page);
        }
    }

    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 600)); // Delay for image rendering

    const opt = {
        margin: 0.2,
        filename: isMetricsView ? "raw-metrics.pdf" : "saved-report.pdf",
        html2canvas: { scale: 2, useCORS: true, width: 1100 },
        jsPDF: { unit: "in", format: "letter", orientation: "landscape" }
    };

    try {
        await html2pdf().set(opt).from(container).save();
    } finally {
        document.body.removeChild(container);
    }
};

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