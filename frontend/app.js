const simulateButton = document.getElementById("simulateBtn");
const simulateInlineButton = document.getElementById("simulateBtnInline");
const transactionForm = document.getElementById("transactionForm");
const kycForm = document.getElementById("kycForm");
const transactionResult = document.getElementById("transactionResult");

function setMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `feedback-message ${type}`;
}

async function fetchDashboard() {
    const response = await fetch("/api/dashboard");
    const data = await response.json();

    document.getElementById("totalTransactions").textContent = data.total_transactions;
    document.getElementById("flaggedTransactions").textContent = data.flagged_count;
    document.getElementById("highRiskTransactions").textContent = data.high_risk_count;
    renderTransactions(data.latest_transactions || []);
}

function renderTransactions(transactions) {
    const list = document.getElementById("transactionList");
    list.innerHTML = "";

    if (!transactions.length) {
        list.innerHTML = "<p>No transactions yet. Run the simulation to generate sample data.</p>";
        return;
    }

    transactions.slice().reverse().forEach((transaction) => {
        const item = document.createElement("div");
        item.className = `transaction-item ${transaction.risk_score >= 70 ? "high-risk" : ""}`;
        const statusText = transaction.is_suspicious ? "Suspicious" : "Safe";
        const statusClass = transaction.is_suspicious ? "suspicious" : "safe";
        item.innerHTML = `
            <div class="transaction-top">
                <div>
                    <div class="transaction-route">${transaction.sender} -> ${transaction.receiver}</div>
                    <div class="transaction-meta">
                        <span>Amount: ${transaction.amount}</span>
                        <span>Country: ${transaction.country}</span>
                        <span>Type: ${transaction.transaction_type}</span>
                    </div>
                </div>
                <span class="status-pill ${statusClass}">${statusText}</span>
            </div>
            <div class="transaction-risk">
                <div class="risk-label">
                    <span>Risk Score</span>
                    <span>${transaction.risk_score}%</span>
                </div>
                <div class="risk-bar">
                    <div class="risk-fill" style="width: ${transaction.risk_score}%"></div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderAnalysisResult(result) {
    const statusText = result.is_suspicious ? "Suspicious" : "Safe";
    const statusClass = result.is_suspicious ? "suspicious" : "safe";

    transactionResult.innerHTML = `
        <div class="analysis-card">
            <div class="analysis-top">
                <div>
                    <h3 class="analysis-title">${result.sender} -> ${result.receiver}</h3>
                    <p class="analysis-meta">Country: ${result.country} | Type: ${result.transaction_type}</p>
                </div>
                <span class="status-pill ${statusClass}">Status: ${statusText}</span>
            </div>
            <div class="risk-row">
                <div class="risk-label">
                    <span>Risk Score</span>
                    <span>${result.risk_score}%</span>
                </div>
                <div class="risk-bar">
                    <div class="risk-fill" style="width: ${result.risk_score}%"></div>
                </div>
            </div>
            <div class="analysis-details">
                <div class="detail-box">
                    <p class="detail-label">Amount</p>
                    <p class="detail-value">${result.amount}</p>
                </div>
                <div class="detail-box">
                    <p class="detail-label">Anomaly Model Result</p>
                    <p class="detail-value">${result.anomaly_prediction === -1 ? "Flagged by model" : "Normal pattern"}</p>
                </div>
            </div>
        </div>
    `;
}

async function runSimulation() {
    simulateButton.disabled = true;
    simulateInlineButton.disabled = true;
    simulateButton.textContent = "Running...";
    simulateInlineButton.textContent = "Generating...";

    try {
        const response = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sample_size: 30 }),
        });
        const result = await response.json();
        const flaggedCount = (result.flagged_transactions || []).length;
        await fetchDashboard();
        setMessage("simulateMessage", `Simulation completed. ${result.total_transactions} transactions processed.`, "success");
        setMessage("simulateInlineMessage", `${flaggedCount} suspicious transaction(s) were flagged.`, "success");
    } catch (error) {
        setMessage("simulateMessage", "Simulation failed. Please check whether the backend is running.", "error");
        setMessage("simulateInlineMessage", "Could not generate demo transactions.", "error");
    } finally {
        simulateButton.disabled = false;
        simulateInlineButton.disabled = false;
        simulateButton.textContent = "Run Simulation";
        simulateInlineButton.textContent = "Generate 30 Transactions";
    }
}

simulateButton.addEventListener("click", runSimulation);
simulateInlineButton.addEventListener("click", runSimulation);

transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(transactionForm);
    const payload = Object.fromEntries(formData.entries());
    payload.amount = Number(payload.amount);

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        renderAnalysisResult(result);
        setMessage(
            "transactionMessage",
            result.is_suspicious
                ? "This transaction looks suspicious and should be reviewed."
                : "This transaction looks safe based on the current demo rules.",
            result.is_suspicious ? "error" : "success"
        );
        await fetchDashboard();
    } catch (error) {
        setMessage("transactionMessage", "Transaction analysis failed. Please try again.", "error");
    }
});

kycForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const payload = Object.fromEntries(new FormData(kycForm).entries());
        const response = await fetch("/api/kyc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        setMessage("kycResult", result.message, result.success ? "success" : "error");
    } catch (error) {
        setMessage("kycResult", "KYC verification failed. Please try again.", "error");
    }
});

fetchDashboard();
