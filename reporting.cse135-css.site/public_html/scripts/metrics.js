let eventChart = null;
let timeChart = null;
let referrerChart = null;
let sessionChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) {
        window.location.href = '/index.html'; // Go to login if not authenticated
        return;
    }

    if (user.role === 'viewer') {
        window.location.href = 'reports.html'; // Viewers can't see live metrics
        return;
    }

    document.getElementById('adminBtn').style.display = (user.role === 'super_admin') ? 'inline-block' : 'none';
    setupLogout();
    loadMetrics();
});

async function loadMetrics() {
    const id = document.getElementById("idFilter").value;
    const type = document.getElementById("typeFilter").value;
    const session = document.getElementById("sessionFilter").value;

    let url = METRICS_API_BASE;
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (session) params.append("session", session);

    if (id) {
        url += `/${id}`;
    } else if (params.toString()) {
        url += `?${params.toString()}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json();
            alert(`Error ${res.status}: ${errorData.error || 'Request failed'}`);
            return;
        }

        let data = await res.json();
        if (!Array.isArray(data)) data = [data];

        renderTable(data);
        renderCharts(data);
    } catch (err) {
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

function renderCharts(data) {
    // 1. Event Type
    const typeCounts = {};
    data.forEach(row => { 
        const type = row.event_type || "unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1; 
    });
    if (eventChart) eventChart.destroy();
    eventChart = new Chart(document.getElementById("eventChart"), {
        type: "bar",
        data: {
            labels: Object.keys(typeCounts),
            datasets: [{ 
                label: "Event Count", 
                data: Object.values(typeCounts), 
                backgroundColor: chartColors 
            }]
        }
    });

    // 2. Time
    const timeCounts = {};
    data.forEach(row => {
        const time = new Date(row.server_timestamp).toLocaleTimeString();
        timeCounts[time] = (timeCounts[time] || 0) + 1;
    });
    if (timeChart) timeChart.destroy();
    timeChart = new Chart(document.getElementById("timeChart"), {
        type: "line",
        data: {
            labels: Object.keys(timeCounts),
            datasets: [{ 
                label: "Events Over Time", 
                data: Object.values(timeCounts), 
                borderColor: chartColors[0], 
                fill: false 
            }]
        }
    });

    // 3. Referrer
    const refCounts = {};
    data.forEach(row => { refCounts[row.referrer || "Direct"] = (refCounts[row.referrer || "Direct"] || 0) + 1; });
    if (referrerChart) referrerChart.destroy();
    referrerChart = new Chart(document.getElementById("referrerChart"), {
        type: "pie",
        data: {
            labels: Object.keys(refCounts),
            datasets: [{ 
                data: Object.values(refCounts), 
                backgroundColor: chartColors 
            }]
        }
    });

    // 4. Session
    const sessionCounts = {};
    data.forEach(row => { sessionCounts[row.session_id || "unknown"] = (sessionCounts[row.session_id || "unknown"] || 0) + 1; });
    if (sessionChart) sessionChart.destroy();
    sessionChart = new Chart(document.getElementById("sessionChart"), {
        type: "bar",
        data: {
            labels: Object.keys(sessionCounts).slice(0, 10),
            datasets: [{ 
                label: "Events per Session", 
                data: Object.values(sessionCounts).slice(0, 10), 
                backgroundColor: chartColors[1] 
            }]
        }
    });
}

// Modal Handlers
function openModal(operation = "create") {
    const modal = document.getElementById('metricModal');
    const submitBtn = document.querySelector('#manualForm .btn-submit');
    const title = document.querySelector('#metricModal h3');
    modal.style.display = 'flex';

    const isDelete = (operation === "delete");
    const isUpdate = (operation === "update");
    
    toggleField('m_id', isUpdate || isDelete);
    ['m_session', 'm_type', 'm_url', 'm_data'].forEach(id => toggleField(id, !isDelete));

    submitBtn.setAttribute('name', operation);
    if (operation === "create") {
        title.textContent = "New Metric Entry";
        submitBtn.textContent = "Create Entry";
        submitBtn.style.backgroundColor = "#28a745";
    } else if (operation === "update") {
        title.textContent = "Update Metric Entry";
        submitBtn.textContent = "Update Entry";
        submitBtn.style.backgroundColor = "#ffed29";
        submitBtn.style.color = "#000";
    } else {
        title.textContent = "Delete Metric Entry";
        submitBtn.textContent = "Delete Entry";
        submitBtn.style.backgroundColor = "#d30000";
    }
}

function toggleField(id, show) {
    const f = document.getElementById(id);
    const l = document.getElementById(id + '_label');
    if (f) f.style.display = show ? 'block' : 'none';
    if (l) l.style.display = show ? 'block' : 'none';
}

function closeModal() {
    document.getElementById('metricModal').style.display = 'none';
    document.getElementById('manualForm').reset();
}

function openReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('saveReportForm').reset();
}

window.onclick = (e) => {
    if (e.target == document.getElementById('metricModal')) closeModal();
    if (e.target == document.getElementById('reportModal')) closeReportModal();
};

document.getElementById('manualForm').onsubmit = async (e) => {
    e.preventDefault();
    const op = document.querySelector('#manualForm .btn-submit').getAttribute('name');
    const id = document.getElementById('m_id').value;
    
    let url = METRICS_API_BASE;
    let method = 'POST';
    if (op === "update") { method = 'PUT'; url += `/${id}`; }
    else if (op === "delete") { method = 'DELETE'; url += `/${id}`; }

    let body = null;
    if (op !== "delete") {
        try {
            const data = document.getElementById('m_data').value;
            body = JSON.stringify({
                session_id: document.getElementById('m_session').value,
                event_type: document.getElementById('m_type').value,
                page_url: document.getElementById('m_url').value || window.location.href,
                page_title: op === "update" ? "Manual Update" : "Manual Entry",
                client_timestamp: Math.floor(Date.now() / 1000),
                event_data: data ? JSON.parse(data) : {}
            });
        } catch (err) { alert("Invalid JSON"); return; }
    }

    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        if (res.ok) { alert("Success!"); closeModal(); loadMetrics(); }
        else { const err = await res.json(); alert("Error: " + err.error); }
    } catch (err) { console.error(err); }
};

document.getElementById('saveReportForm').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('report_title').value;
    
    let categories = [];
    if (currentUser.role === 'super_admin') {
        categories = ['performance', 'behavioral', 'errors'];
    } else if (currentUser.sections && currentUser.sections.length > 0) {
        categories = currentUser.sections;
    } else {
        categories = ['performance']; // Fallback
    }

    const config = {
        type: document.getElementById("typeFilter").value,
        session: document.getElementById("sessionFilter").value
    };

    try {
        // Save a report for each category assigned to the analyst
        for (const category of categories) {
            await fetch(`${REPORTS_API}?action=create_report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category, config })
            });
        }
        alert("Report(s) saved successfully!");
        closeReportModal();
    } catch (err) {
        console.error("Failed to save report:", err);
    }
};

window.exportPDF = async function () {
    const container = document.createElement("div");

    container.style.width = "1000px"; 
    container.style.background = "white";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.color = "#000";

    const createPage = (titleText) => {
        const div = document.createElement("div");
        div.style.pageBreakAfter = "always";
        div.style.textAlign = "center";
        div.style.padding = "20px";
        const h = document.createElement("h2");
        h.innerText = titleText;
        div.appendChild(h);
        return div;
    };

    // 1. Charts
    const charts = [
        {obj: eventChart, name: "Event Distribution"},
        {obj: timeChart, name: "Events Over Time"},
        {obj: referrerChart, name: "Top Referrers"},
        {obj: sessionChart, name: "Session Activity"}
    ];

    charts.forEach(c => {
        if (!c.obj) return;
        const p = createPage(c.name);
        const img = document.createElement("img");
        img.src = c.obj.toBase64Image();
        img.style.width = "90%";
        img.style.border = "1px solid #eee";
        p.appendChild(img);
        container.appendChild(p);
    });

    // 2. Table Data
    const table = document.getElementById("metricsTable");
    if (table) {
        const p = createPage("Data Snapshot (Top 20)");
        const clone = table.cloneNode(true);
        const rows = clone.querySelectorAll("tbody tr");
        rows.forEach((r, i) => { if (i > 20) r.remove(); });
        
        clone.style.width = "100%";
        clone.style.borderCollapse = "collapse";
        clone.style.fontSize = "10px";
        clone.querySelectorAll("th, td").forEach(cell => {
            cell.style.border = "1px solid #ccc";
            cell.style.padding = "6px";
            cell.style.whiteSpace = "normal";
            cell.style.wordBreak = "break-all";
        });
        p.appendChild(clone);
        container.appendChild(p);
    }

    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 500));
    const opt = { 
        margin: 0.5, 
        filename: "metrics-dashboard.pdf", 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: "in", format: "letter", orientation: "landscape" } 
    };
    
    try {
        await html2pdf().set(opt).from(container).save();
    } catch (err) {
        console.error("PDF Export failed:", err);
    } finally {
        document.body.removeChild(container);
    }
};
