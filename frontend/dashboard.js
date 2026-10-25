const simulationForm = document.getElementById("simulationForm");
const kycForm = document.getElementById("kycForm");
const transactionForm = document.getElementById("transactionForm");
const transactionTableBody = document.getElementById("transactionTableBody");
const alertsList = document.getElementById("alertsList");
const blockchainLogList = document.getElementById("blockchainLogList");
const analysisPanel = document.getElementById("analysisPanel");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
});

function setMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = `feedback-message ${type}`;
}

function setText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatMoney(amount) {
    return currencyFormatter.format(Number(amount || 0));
}

function formatDate(timestamp) {
    if (!timestamp) {
        return "N/A";
    }

    return new Date(timestamp).toLocaleString("en-IN");
}

function statusClassFromRisk(riskLevel) {
    return String(riskLevel || "low").toLowerCase();
}

function renderUserSummary(data) {
    const alerts = data.alerts || [];
    const blockchainLogs = data.blockchain_logs || [];

    setText("welcomeTitle", `Welcome back, ${data.username}`);
    setText("profileName", data.username);
    setText("profileRole", data.email);
    setText("balanceValue", formatMoney(data.balance));
    setText("volumeValue", formatMoney(data.total_volume));
    setText("totalTransactions", data.total_transactions || 0);
    setText("suspiciousCount", data.suspicious_count || 0);
    setText("alertCount", alerts.length);
    setText("logCount", blockchainLogs.length);

    const badge = document.getElementById("riskBadge");
    if (badge) {
        badge.textContent = data.risk_level;
        badge.className = `status-pill ${statusClassFromRisk(data.risk_level)}`;
    }

    setText(
        "heroMessage",
        alerts.length
            ? `${alerts.length} alert(s) need attention. Review the flagged transactions and blockchain trail below.`
            : "No high-priority alerts right now. Monitoring remains active."
    );

    renderTransactions(data.recent_transactions || []);
    renderAlerts(alerts);
    renderBlockchainLogs(blockchainLogs);
}

function renderTransactions(transactions) {
    if (!transactionTableBody) {
        return;
    }

    transactionTableBody.innerHTML = "";

    if (!transactions.length) {
        transactionTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions available yet. Run a simulation or analyze a new transfer.</td></tr>';
        return;
    }

    transactions.forEach((transaction) => {
        const row = document.createElement("tr");
        const statusText = transaction.is_suspicious ? "Suspicious" : "Safe";
        const statusClass = transaction.is_suspicious ? "suspicious" : "safe";
        row.className = transaction.is_suspicious ? "suspicious-row" : "";
        row.innerHTML = `
            <td>${transaction.sender}</td>
            <td>${transaction.receiver}</td>
            <td class="amount-text ${transaction.is_suspicious ? "danger" : ""}">${formatMoney(transaction.amount)}</td>
            <td><span class="status-pill ${statusClass}">${statusText}</span></td>
            <td>${transaction.risk_score}%</td>
            <td>${formatDate(transaction.timestamp)}</td>
        `;
        transactionTableBody.appendChild(row);
    });
}

function renderAlerts(alerts) {
    if (!alertsList) {
        return;
    }

    alertsList.innerHTML = "";

    if (!alerts.length) {
        alertsList.innerHTML = '<div class="analysis-empty">No flagged transactions. The alert queue is currently clear.</div>';
        return;
    }

    alerts.forEach((alert) => {
        const item = document.createElement("article");
        item.className = "alert-item";
        item.innerHTML = `
            <div class="alert-top">
                <div>
                    <h4 class="alert-title">&#9888; ${alert.sender} to ${alert.receiver}</h4>
                    <p class="transaction-meta">${alert.transaction_type} | ${alert.country} | ${formatDate(alert.timestamp)}</p>
                </div>
                <span class="warning-icon">&#9888;</span>
            </div>
            <p class="transaction-meta">Amount: ${formatMoney(alert.amount)} | Risk score: ${alert.risk_score}%</p>
        `;
        alertsList.appendChild(item);
    });
}

function renderBlockchainLogs(logs) {
    if (!blockchainLogList) {
        return;
    }

    blockchainLogList.innerHTML = "";

    if (!logs.length) {
        blockchainLogList.innerHTML = '<div class="analysis-empty">No blockchain audit logs available for the latest transactions yet.</div>';
        return;
    }

    logs.forEach((log) => {
        const item = document.createElement("article");
        item.className = "log-item";
        item.innerHTML = `
            <div class="log-top">
                <div>
                    <h4 class="log-title">${log.transaction_id}</h4>
                    <p class="log-meta">${log.sender} to ${log.receiver} | ${formatMoney(log.amount)} | ${formatDate(log.timestamp)}</p>
                </div>
                <span class="status-pill ${log.status.toLowerCase()}">${log.status}</span>
            </div>
            <p class="hash-snippet">${log.hash}</p>
        `;
        blockchainLogList.appendChild(item);
    });
}

function renderAnalysisResult(result) {
    if (!analysisPanel) {
        return;
    }

    const statusText = result.is_suspicious ? "Suspicious" : "Safe";
    const statusClass = result.is_suspicious ? "suspicious" : "safe";

    analysisPanel.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-top">
                <div>
                    <h4 class="analysis-title">${result.sender} to ${result.receiver}</h4>
                    <p class="transaction-meta">${result.country} | ${result.transaction_type} | ${formatDate(result.timestamp)}</p>
                </div>
                <span class="status-pill ${statusClass}">${statusText}</span>
            </div>
            <div class="analysis-grid">
                <div class="detail-box">
                    <p class="status-label">Amount</p>
                    <strong>${formatMoney(result.amount)}</strong>
                </div>
                <div class="detail-box">
                    <p class="status-label">Risk Score</p>
                    <strong>${result.risk_score}%</strong>
                </div>
                <div class="detail-box">
                    <p class="status-label">Updated Balance</p>
                    <strong>${formatMoney(result.balance)}</strong>
                </div>
                <div class="detail-box">
                    <p class="status-label">User Risk Level</p>
                    <strong>${result.risk_level}</strong>
                </div>
                <div class="detail-box">
                    <p class="status-label">AI Decision</p>
                    <strong>${result.anomaly_prediction === -1 ? "Flagged by anomaly model" : "Normal behavioral pattern"}</strong>
                </div>
            </div>
        </div>
    `;
}

async function loadDashboard() {
    const response = await fetch("/api/dashboard");

    if (response.status === 401) {
        window.location.href = "/login";
        return;
    }

    const data = await response.json();
    renderUserSummary(data);
}

if (simulationForm) {
    simulationForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(simulationForm).entries());
        payload.sample_size = Number(payload.sample_size);

        const response = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok) {
            setMessage("simulationMessage", result.message || "Simulation failed.", "error");
            return;
        }

        setMessage("simulationMessage", `${result.total_transactions} transaction(s) generated successfully.`, "success");
        setText("heroMessage", `${result.flagged_transactions.length} suspicious transaction(s) flagged in the latest simulation.`);
        await loadDashboard();
    });
}

if (kycForm) {
    kycForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(kycForm).entries());

        const response = await fetch("/api/kyc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        setMessage("kycMessage", result.message, result.success ? "success" : "error");
    });
}

if (transactionForm) {
    transactionForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(transactionForm).entries());
        payload.amount = Number(payload.amount);

        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok || result.success === false) {
            setMessage("transactionMessage", result.message || "Transaction analysis failed.", "error");
            return;
        }

        renderAnalysisResult(result);
        setMessage(
            "transactionMessage",
            result.is_suspicious
                ? "Transaction saved and flagged for compliance review."
                : "Transaction saved successfully and marked safe.",
            result.is_suspicious ? "error" : "success"
        );
        await loadDashboard();
    });
}

loadDashboard();
