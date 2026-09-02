// Data Models & Limits[cite: 4]
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

// DOM Elements
const boothSelect = document.getElementById("booth-select");
const locationInput = document.getElementById("location-input");
const serviceSelect = document.getElementById("service-select");
const revenueInput = document.getElementById("revenue-rate");
const amountInput = document.getElementById("amount");
const form = document.getElementById("wb-form");

// View Switching Logic
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(viewId).classList.add('active');
    event.target.classList.add('active');

    if (viewId === 'dashboard-view') {
        renderDashboard();
    }
}

// Dependent Dropdown Logic[cite: 4]
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
    } else {
        locationInput.value = "";
        serviceSelect.innerHTML = '<option value="">Select booth first...</option>';
        serviceSelect.disabled = true;
        revenueInput.value = "";
    }
});

serviceSelect.addEventListener("change", function () {
    if (this.value) revenueInput.value = serviceRates[this.value];
    else revenueInput.value = "";
});

// Toast System[cite: 1]
function showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Form Submission[cite: 1, 4]
form.addEventListener("submit", function (e) {
    e.preventDefault();
    const service = serviceSelect.value;
    const amount = parseFloat(amountInput.value);

    if (!boothSelect.value || !service || isNaN(amount) || amount <= 0) {
        showToast("Please provide valid input values.", "error");
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
});

// Dashboard Renderer[cite: 4]
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

    renderPieChart(totalRevenue, totalCap);
}

// Pie Chart Rendering[cite: 4]
function renderPieChart(rev, cap) {
    const ctx = document.getElementById('summaryPieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Total Generated Revenue', 'Total Required Capital'],
            datasets: [{
                data: [rev, cap],
                backgroundColor: ['#10b981', '#2563eb']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}