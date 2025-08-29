// Tracker functionality
class TrackerController {
  constructor(app) {
    this.app = app;
    this.months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.initTracker();
  }

  initTracker() {
    this.renderTrackerGrid();
  }

  renderTrackerGrid() {
    const grid = document.getElementById("trackerGrid");
    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 0; i < 12; i++) {
      const monthCard = this.createMonthCard(i);
      grid.appendChild(monthCard);
    }
  }

  createMonthCard(monthIndex) {
    const card = document.createElement("div");
    card.className = "month-card";

    const deposit = this.app.userData.deposits[monthIndex];
    const currentMonth = this.app.getCurrentMonth();

    // Determine status
    let status = "pending";
    let statusText = "Pending";
    let amount = "R0.00";

    if (deposit) {
      status = "paid";
      statusText = "Paid";
      amount = `R0.00{deposit.amount}`;
      card.classList.add("paid");
    } else if (monthIndex < currentMonth) {
      status = "missed";
      statusText = "Missed";
      card.classList.add("missed");
    } else if (monthIndex === currentMonth) {
      statusText = "Current";
      card.classList.add("current");
    }

    // Get month name based on start date
    const startDate = new Date(this.app.userData.startDate || new Date());
    const monthDate = new Date(startDate);
    monthDate.setMonth(startDate.getMonth() + monthIndex);
    const monthName = this.months[monthDate.getMonth()];

    card.innerHTML = `
            <div class="month-title">${monthName}</div>
            <div class="month-status">
                <div class="status-icon ${status}"></div>
                <span>${statusText}</span>
            </div>
            <div class="month-amount">${amount}</div>
        `;

    // Add click handler for current month
    if (monthIndex === currentMonth && !deposit) {
      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        this.app.switchTab("dashboard");
        document.getElementById("depositAmount").focus();
      });
    }

    return card;
  }

  updateTracker() {
    this.renderTrackerGrid();
  }

  getCompletionRate() {
    const totalMonths = 12;
    const completedMonths = Object.keys(this.app.userData.deposits).length;
    return (completedMonths / totalMonths) * 100;
  }

  getConsistencyScore() {
    const deposits = Object.keys(this.app.userData.deposits)
      .map(Number)
      .sort((a, b) => a - b);
    let consecutiveMonths = 0;
    let maxConsecutive = 0;

    for (let i = 0; i < deposits.length; i++) {
      if (i === 0 || deposits[i] === deposits[i - 1] + 1) {
        consecutiveMonths++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMonths);
      } else {
        consecutiveMonths = 1;
      }
    }

    return maxConsecutive;
  }
}

// Initialize tracker when app is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.vaultScoreApp) {
      window.trackerController = new TrackerController(window.vaultScoreApp);

      // Update tracker when switching to tracker tab
      const originalUpdateUI = window.vaultScoreApp.updateUI;
      window.vaultScoreApp.updateUI = function () {
        originalUpdateUI.call(this);
        if (this.currentTab === "tracker" && window.trackerController) {
          window.trackerController.updateTracker();
        }
      };
    }
  }, 100);
});
