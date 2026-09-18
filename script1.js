// Data Models & Limits
const boothLocations = {
    "Wina1": "Lusaka CPD", "Wina2": "Libala", "Wina3": "Kabwata",
    "Wina4": "Mandevu", "Wina5": "Woodlands", "Wina6": "Matero East"
};

const boothServices = {
    "Wina1": ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    "Wina2": ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"],
    "Wina3": ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    "Wina4": ["Airtel Money", "MTN Money", "Zamtel Money"],
    "Wina5": ["Airtel Money", "MTN Money", "Zanaco", "FNB"],
    "Wina6": ["Airtel Money", "MTN Money", "Zamtel Money"]
};

const serviceRates = {
    "Airtel Money": 0.05, "MTN Money": 0.06, "Zamtel Money": 0.045,
    "Zanaco": 0.035, "FNB": 0.04
};

const serviceLimits = {
    "Airtel Money": 350000, "MTN Money": 160000, "Zamtel Money": 70000,
    "Zanaco": 80000, "FNB": 80000
};

// State Storage
let cumulativeTotals = { "Airtel Money": 0, "MTN Money": 0, "Zamtel Money": 0, "Zanaco": 0, "FNB": 0 };
let totalRevenue = 0;
let totalTransactions = 0;
let pieChartInstance = null;

// Register Chart.js DataLabels plugin
Chart.register(ChartDataLabels);

// DOM Elements
const boothSelect = document.getElementById("booth-select");
const locationInput = document.getElementById("location-input");
const serviceSelect = document.getElementById("service-select");
const revenueInput = document.getElementById("revenue-rate");
const amountInput = document.getElementById("amount");
const amountHint = document.getElementById("amount-hint");
const chartFilter = document.getElementById("chart-service-filter");
const form = document.getElementById("wb-form");

// View Switching Logic
function switchView(viewId, event) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(viewId).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (viewId === 'dashboard-view') {
        renderDashboard();
    }
}

// Dependent Dropdown & Limit Display Logic
boothSelect.addEventListener("change", function () {
    const selectedBooth = this.value;
    if (selectedBooth) {
        locationInput.value = boothLocations[selectedBooth];
        serviceSelect.innerHTML = '<option value="">Select service...</option>';
        boothServices[selectedBooth].forEach(service => {
            const opt = document.createElement("option");
            opt.value = service;
            opt.textContent = service;
            serviceSelect.appendChild(opt);
        });
        serviceSelect.disabled = false;
        revenueInput.value = "";
        resetAmountConstraints();
    } else {
        locationInput.value = "";
        serviceSelect.innerHTML = '<option value="">Select booth first...</option>';
        serviceSelect.disabled = true;
        revenueInput.value = "";
        resetAmountConstraints();
    }
});

serviceSelect.addEventListener("change", function () {
    const service = this.value;
    if (service) {
        revenueInput.value = serviceRates[service];
        const limit = serviceLimits[service];
        const currentUsed = cumulativeTotals[service];
        const maxAllowed = Math.max(0, limit - currentUsed);

        amountInput.max = maxAllowed;
        amountHint.textContent = `Min: ZMW 1.00 | Max Allowed: ZMW ${maxAllowed.toLocaleString()} (Limit: ZMW ${limit.toLocaleString()})`;
    } else {
        revenueInput.value = "";
        resetAmountConstraints();
    }
});

function resetAmountConstraints() {
    amountInput.removeAttribute("max");
    amountHint.textContent = "Minimum: ZMW 1.00 | Select service to view max limit.";
}

// Toast System[cite: 1]
function showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Form Submission & Input Validation[cite: 1]
form.addEventListener("submit", function (e) {
    e.preventDefault();
    const service = serviceSelect.value;
    const amount = parseFloat(amountInput.value);

    // 1. Basic empty check
    if (!boothSelect.value || !service || isNaN(amount)) {
        showToast("Please fill in all required fields properly.", "error");
        return;
    }

    // 2. Minimum amount validation (No negatives, minimum ZMW 1.00)
    if (amount < 1) {
        showToast("Invalid Amount: Transactions must be at least ZMW 1.00.", "error");
        return;
    }

    // 3. Upper limit validation against remaining service capacity
    const limit = serviceLimits[service];
    const currentUsed = cumulativeTotals[service];
    const remainingLimit = limit - currentUsed;

    if (amount > remainingLimit) {
        if (remainingLimit <= 0) {
            showToast(`Transaction rejected: ${service} has reached its monthly limit of ZMW ${limit.toLocaleString()}.`, "error");
        } else {
            showToast(`Transaction exceeds limit! Max remaining balance for ${service} is ZMW ${remainingLimit.toLocaleString()}.`, "error");
        }
        return;
    }

    // Accumulate metrics
    const rate = serviceRates[service];
    const rev = amount * rate;
    
    cumulativeTotals[service] += amount;
    totalRevenue += rev;
    totalTransactions++;

    showToast(`Logged ZMW ${amount.toFixed(2)} for ${service}!`, "success");

    // Reset Form
    form.reset();
    locationInput.value = "";
    serviceSelect.innerHTML = '<option value="">Select booth first...</option>';
    serviceSelect.disabled = true;
    revenueInput.value = "";
    resetAmountConstraints();
});

// Dashboard Renderer
function renderDashboard() {
    let totalCap = 0;
    const tableBody = document.getElementById("service-limits-body");
    tableBody.innerHTML = "";

    Object.keys(serviceLimits).forEach(service => {
        const limit = serviceLimits[service];
        const used = cumulativeTotals[service];
        const remaining = Math.max(0, limit - used);
        totalCap += limit;

        const percentage = Math.min(100, (remaining / limit) * 100);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${service}</strong></td>
            <td>ZMW ${limit.toLocaleString()}</td>
            <td>ZMW ${used.toLocaleString()}</td>
            <td>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <small>${percentage.toFixed(1)}% remaining</small>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("dash-total-revenue").textContent = `ZMW ${totalRevenue.toFixed(2)}`;
    document.getElementById("dash-total-capital").textContent = `ZMW ${totalCap.toLocaleString()}`;
    document.getElementById("dash-total-count").textContent = totalTransactions;

    updateChartFilter();
}

// Sub-chart Filter Trigger
function updateChartFilter() {
    const selected = chartFilter.value;

    if (selected === "OVERALL") {
        let totalCap = Object.values(serviceLimits).reduce((a, b) => a + b, 0);
        renderPieChart(['Total Generated Revenue', 'Total Required Capital'], [totalRevenue, totalCap]);
    } else {
        const used = cumulativeTotals[selected];
        const limit = serviceLimits[selected];
        const serviceRev = used * serviceRates[selected];
        const remainingCap = Math.max(0, limit - used);

        renderPieChart(
            [`${selected} Revenue`, `${selected} Used Volume`, 'Remaining Limit Capacity'],
            [serviceRev, used, remainingCap]
        );
    }
}

// Dynamic Pie/Doughnut Chart Rendering with On-Slice DataLabels
function renderPieChart(labels, data) {
    const ctx = document.getElementById('summaryPieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    const colors = labels.length === 2 
        ? ['#10b981', '#2563eb'] 
        : ['#10b981', '#3b82f6', '#cbd5e1'];

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#1e293b',
                        font: { size: 12, weight: '600' }
                    }
                },
                datalabels: {
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value, context) => {
                        if (value === 0) return '';
                        const sum = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / sum) * 100).toFixed(1) + '%';
                        const formattedVal = value >= 1000 ? 'K' + (value / 1000).toFixed(1) + 'k' : 'K' + value.toFixed(2);
                        return `${formattedVal}\n(${percentage})`;
                    },
                    textAlign: 'center',
                    textStrokeColor: '#0f172a',
                    textStrokeWidth: 2
                }
            }
        }
    });
}


