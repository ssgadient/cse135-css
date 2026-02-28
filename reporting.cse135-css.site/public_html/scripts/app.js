const API_BASE = "/api/metrics";

async function loadMetrics() {
  const type = document.getElementById("typeFilter").value;
  const session = document.getElementById("sessionFilter").value;

  let url = API_BASE;
  const params = new URLSearchParams();

  if (type) params.append("type", type);
  if (session) params.append("session", session);

  if (params.toString())
    url += "?" + params.toString();

  try {
    const res = await fetch(url);
    const data = await res.json();

    renderTable(data);

  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

function renderTable(rows) {
  const tbody = document.querySelector("#metricsTable tbody");
  tbody.innerHTML = "";

  rows.forEach(row => {
    const tr = document.createElement("tr");

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
      <td><pre>${prettyJSON(row.event_data)}</pre></td>
    `;

    tbody.appendChild(tr);
  });
}

function prettyJSON(data) {
  try {
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return data || "";
  }
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

// auto-load on page open
loadMetrics();