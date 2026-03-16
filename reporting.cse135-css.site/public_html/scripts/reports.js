let reportEventChart = null;
let reportTimeChart = null;
let reportReferrerChart = null;
let reportSessionChart = null;
let currentReportId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) {
        window.location.href = '/index.html';
        return;
    }

    // Viewers CAN see reports, so no redirect needed
    if (user.role === 'viewer') {
        const nav = document.getElementById('metricsNav');
        if (nav) nav.style.display = 'none';
    }

    document.getElementById('adminBtn').style.display = (user.role === 'super_admin') ? 'inline-block' : 'none';
    setupLogout();
    loadReports();
});

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
        const categoriesText = Array.isArray(report.categories) ? report.categories.join(', ') : 'None';
        const typeFilter = report.config?.type || "All";
        const sessionFilter = report.config?.session || "All";

        const card = document.createElement('div');
        card.className = 'report-card';
        card.innerHTML = `
            <h3>${report.title}</h3>
            <p><strong>Categories:</strong> ${categoriesText}</p>
            <p><strong>Filter Type:</strong> ${typeFilter}</p>
            <p><strong>Filter Session:</strong> ${sessionFilter}</p>
            <p><strong>Author:</strong> ${report.creator_name}</p>
            <p><small>${new Date(report.created_at).toLocaleString()}</small></p>
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
        
        if (!res.ok) {
            alert("Error: " + (report.error || "Failed to load report"));
            return;
        }

        document.getElementById('selectedReport').style.display = 'block';
        document.getElementById('reportTitle').innerText = report.title;
        
        renderReportCharts(report.data);
        renderComments(report.comments);
        
        document.getElementById('selectedReport').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("Failed to load report details:", err);
    }
}

function renderReportCharts(data) {
    const purpleTheme = '#8b5cf6'; // Keep consistency for reports if you like, or use chartColors[0]
    const themeColor = chartColors[4]; // Purple from my new palette

    // 1. Event Type
    const typeCounts = {};
    data.forEach(row => { 
        const type = row.event_type || "unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1; 
    });
    if (reportEventChart) reportEventChart.destroy();
    reportEventChart = new Chart(document.getElementById("reportEventChart"), {
        type: "bar",
        data: {
            labels: Object.keys(typeCounts),
            datasets: [{ label: "Event Count", data: Object.values(typeCounts), backgroundColor: chartColors }]
        }
    });

    // 2. Time
    const timeCounts = {};
    data.forEach(row => {
        const time = new Date(row.server_timestamp).toLocaleTimeString();
        timeCounts[time] = (timeCounts[time] || 0) + 1;
    });
    if (reportTimeChart) reportTimeChart.destroy();
    reportTimeChart = new Chart(document.getElementById("reportTimeChart"), {
        type: "line",
        data: {
            labels: Object.keys(timeCounts),
            datasets: [{ label: "Events Over Time", data: Object.values(timeCounts), borderColor: themeColor, fill: false }]
        }
    });

    // 3. Referrer
    const refCounts = {};
    data.forEach(row => { refCounts[row.referrer || "Direct"] = (refCounts[row.referrer || "Direct"] || 0) + 1; });
    if (reportReferrerChart) reportReferrerChart.destroy();
    reportReferrerChart = new Chart(document.getElementById("reportReferrerChart"), {
        type: "pie",
        data: {
            labels: Object.keys(refCounts),
            datasets: [{ data: Object.values(refCounts), backgroundColor: chartColors }]
        }
    });

    // 4. Session
    const sessionCounts = {};
    data.forEach(row => { sessionCounts[row.session_id || "unknown"] = (sessionCounts[row.session_id || "unknown"] || 0) + 1; });
    if (reportSessionChart) reportSessionChart.destroy();
    reportSessionChart = new Chart(document.getElementById("reportSessionChart"), {
        type: "bar",
        data: {
            labels: Object.keys(sessionCounts).slice(0, 10),
            datasets: [{ label: "Events per Session", data: Object.values(sessionCounts).slice(0, 10), backgroundColor: chartColors[2] }]
        }
    });
}

function renderComments(comments) {
    const list = document.getElementById('commentsList');
    list.innerHTML = "";
    comments.forEach(c => {
        const div = document.createElement('div');
        div.style.padding = '15px';
        div.style.borderBottom = '1px solid #eee';
        div.innerHTML = `
            <strong>${c.username}</strong> <small>${new Date(c.created_at).toLocaleString()}</small>
            <p style="margin-top: 5px;">${c.comment}</p>
        `;
        list.appendChild(div);
    });
    
    // Hide comment form for viewers
    const form = document.getElementById('addCommentForm');
    if (form) form.style.display = (currentUser.role === 'viewer') ? 'none' : 'block';
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

window.exportPDF = async function () {
    const title = document.getElementById('reportTitle').innerText;
    if (!title || currentReportId === null) {
        alert("Please select a report first.");
        return;
    }

    const container = document.createElement("div");
    container.style.width = "1000px"; 
    container.style.background = "white";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.color = "#000"; 

    const createPage = (titleText) => {
        const div = document.createElement("div");
        div.style.pageBreakAfter = "always";
        div.style.textAlign = "center";
        const h = document.createElement("h2");
        h.innerText = titleText;
        div.appendChild(h);
        return div;
    };

    const p = createPage(`Report: ${title}`);
    
    const charts = [
        {obj: reportEventChart, name: "Event Distribution"},
        {obj: reportTimeChart, name: "Events Over Time"},
        {obj: reportReferrerChart, name: "Referrers"},
        {obj: reportSessionChart, name: "Sessions"}
    ];

    charts.forEach(c => {
        if (!c.obj) return;
        const img = document.createElement("img");
        img.src = c.obj.toBase64Image();
        img.style.width = "45%";
        img.style.margin = "10px";
        img.style.border = "1px solid #eee";
        p.appendChild(img);
    });

    const comments = document.getElementById('commentsList').cloneNode(true);
    comments.style.textAlign = "left";
    comments.style.marginTop = "30px";
    p.appendChild(comments);
    
    container.appendChild(p);

    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 500));
    const opt = { margin: 0.5, filename: `report-${title}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: "in", format: "letter", orientation: "landscape" } };
    
    try {
        await html2pdf().set(opt).from(container).save();
    } finally {
        document.body.removeChild(container);
    }
};
