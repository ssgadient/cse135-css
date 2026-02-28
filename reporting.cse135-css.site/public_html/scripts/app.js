const API_BASE = "/api/metrics";

async function loadMetrics() {
  const id = document.getElementById("idFilter").value;
  const type = document.getElementById("typeFilter").value;
  const session = document.getElementById("sessionFilter").value;

  let url = API_BASE;
  const params = new URLSearchParams();

  if (type) params.append("type", type);
  if (session) params.append("session", session);

  // This is a rest endpoint, so use id as part of path, and add type and session as query params
  if (id) url += `/${id}`;
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  const data = await res.json();

  renderTable(data);
}

function renderTable(rows) {
  const tbody = document.querySelector("#metricsTable tbody");
  tbody.innerHTML = "";

  rows.forEach(row => {
    const tr = document.createElement("tr");

    const dataCell = document.createElement("td");
    dataCell.appendChild(renderJSON(row.event_data));

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
  return new Date(ts).toLocaleString();
}

loadMetrics();