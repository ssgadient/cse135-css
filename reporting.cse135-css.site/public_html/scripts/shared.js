const LOGIN_API = "/api/login";
const LOGOUT_API = "/api/logout";
const REPORTS_API = "/api/reports";
const METRICS_API_BASE = "/api/metrics";

let currentUser = null;

async function checkAuth() {
    try {
        const res = await fetch(LOGIN_API, { method: 'GET' });
        if (res.ok) {
            currentUser = await res.json();
            return currentUser;
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
    return null;
}

function setupLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
        btn.onclick = async () => {
            await fetch(LOGOUT_API, { method: 'POST' });
            window.location.href = '/';
        };
    }
}

function formatDate(ts) {
    if (!ts) return "";
    let date = isNaN(ts) ? new Date(ts) : new Date(Number(ts) < 10000000000 ? ts * 1000 : ts);
    return date.toLocaleString();
}

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
    Object.entries(obj).forEach(([key,value]) => {
        const row = document.createElement("tr");
        const keyCell = document.createElement("td");
        keyCell.className = "json-key";
        keyCell.textContent = key;
        const valueCell = document.createElement("td");
        valueCell.className = "json-value";

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

// Standard colors for charts (Reverting to more varied colors)
const chartColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
];
