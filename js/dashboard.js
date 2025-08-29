// Dashboard specific functionality
class DashboardController {
  constructor(app) {
    this.app = app;
    this.setupDashboardEvents();
  }

  setupDashboardEvents() {
    // Auto-update dashboard every minute
    setInterval(() => {
      if (this.app.currentTab === "dashboard") {
        this.app.updateDashboard();
      }
    }, 60000);

    // Add hover effects to stat cards
    const statCards = document.querySelectorAll(".stat-card");
    statCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        this.animateStatCard(card);
      });
    });
  }

  animateStatCard(card) {
    const value = card.querySelector(".stat-value");
    if (value) {
      value.style.transform = "scale(1.05)";
      setTimeout(() => {
        value.style.transform = "scale(1)";
      }, 200);
    }
  }

  updateDepositHistory() {
    // This could be expanded to show a detailed history
    const deposits = Object.values(this.app.userData.deposits);
    const lastDeposit = deposits[deposits.length - 1];

    if (lastDeposit) {
      const changeElement = document.querySelector(".stat-change.positive");
      if (changeElement) {
        changeElement.textContent = `+$${lastDeposit.amount} this month`;
      }
    }
  }

  calculateProjectedGrowth() {
    const currentDeposits = this.app.userData.totalDeposited;
    const monthsRemaining = 12 - Object.keys(this.app.userData.deposits).length;
    const avgDeposit =
      currentDeposits /
      Math.max(1, Object.keys(this.app.userData.deposits).length);

    return {
      projectedTotal: currentDeposits + avgDeposit * monthsRemaining,
      projectedInterest: this.calculateProjectedInterest(
        avgDeposit,
        monthsRemaining
      ),
    };
  }

  calculateProjectedInterest(avgDeposit, monthsRemaining) {
    const monthlyRate = 0.045 / 12;
    let projectedInterest = this.app.calculateInterest();

    // Add projected interest for remaining months
    for (let i = 0; i < monthsRemaining; i++) {
      projectedInterest += avgDeposit * monthlyRate * (monthsRemaining - i);
    }

    return projectedInterest;
  }
}

// Initialize dashboard controller when app is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.vaultScoreApp) {
      window.dashboardController = new DashboardController(
        window.vaultScoreApp
      );
    }
  }, 100);
});
