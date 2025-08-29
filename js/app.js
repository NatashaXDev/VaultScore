// Main App Controller
class VaultScoreApp {
  constructor() {
    this.currentTab = "dashboard";
    this.userData = this.loadUserData();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    // Tab navigation
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Make deposit button
    const depositBtn = document.getElementById("makeDeposit");
    if (depositBtn) {
      depositBtn.addEventListener("click", () => {
        this.makeDeposit();
      });
    }

    // Deposit amount input
    const depositInput = document.getElementById("depositAmount");
    if (depositInput) {
      depositInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.makeDeposit();
        }
      });
    }
  }

  switchTab(tabName) {
    // Update navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(tabName).classList.add("active");

    this.currentTab = tabName;
    this.updateUI();
  }

  makeDeposit() {
    const amountInput = document.getElementById("depositAmount");
    const amount = parseFloat(amountInput.value);

    if (!amount || amount < 25) {
      this.showNotification("Minimum deposit is $25", "error");
      return;
    }

    if (amount > 1000) {
      this.showNotification("Maximum deposit is $1000", "error");
      return;
    }

    // Check if current month already has a deposit
    const currentMonth = this.getCurrentMonth();
    if (this.userData.deposits[currentMonth]) {
      this.showNotification(
        "You have already made a deposit this month",
        "warning"
      );
      return;
    }

    // Add deposit
    this.userData.deposits[currentMonth] = {
      amount: amount,
      date: new Date().toISOString(),
      month: currentMonth,
    };

    this.userData.totalDeposited += amount;
    this.saveUserData();
    this.updateUI();

    amountInput.value = "";
    this.showNotification(`Successfully deposited $${amount}!`, "success");
  }

  getCurrentMonth() {
    if (!this.userData.startDate) {
      this.userData.startDate = new Date().toISOString();
      this.saveUserData();
    }

    const start = new Date(this.userData.startDate);
    const now = new Date();
    const monthsDiff =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    return Math.min(monthsDiff, 11); // 0-11 for 12 months
  }

  calculateInterest() {
    const monthlyRate = 0.045 / 12; // 4.5% APY
    let totalInterest = 0;

    Object.values(this.userData.deposits).forEach((deposit) => {
      const depositDate = new Date(deposit.date);
      const now = new Date();
      const monthsElapsed = Math.max(
        0,
        (now.getTime() - depositDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      totalInterest += deposit.amount * monthlyRate * monthsElapsed;
    });

    return totalInterest;
  }

  calculateCreditImpact() {
    const monthsWithDeposits = Object.keys(this.userData.deposits).length;
    const consistencyBonus = monthsWithDeposits >= 3 ? 10 : 0;
    const baseImpact = monthsWithDeposits * 8;
    return Math.min(baseImpact + consistencyBonus, 100);
  }

  updateUI() {
    if (this.currentTab === "dashboard") {
      this.updateDashboard();
    } else if (this.currentTab === "tracker") {
      this.updateTracker();
    } else if (this.currentTab === "simulator") {
      this.updateSimulator();
    }
  }

  updateDashboard() {
    const interest = this.calculateInterest();
    const creditImpact = this.calculateCreditImpact();
    const monthsCompleted = Object.keys(this.userData.deposits).length;
    const monthsRemaining = Math.max(0, 12 - monthsCompleted);

    // Update stats
    document.getElementById(
      "totalDeposited"
    ).textContent = `$${this.userData.totalDeposited.toFixed(0)}`;
    document.getElementById(
      "interestEarned"
    ).textContent = `$${interest.toFixed(2)}`;
    document.getElementById("timeRemaining").textContent =
      monthsRemaining === 0 ? "Eligible!" : `${monthsRemaining} months`;
    document.getElementById("creditImpact").textContent = `+${creditImpact}`;

    // Update progress bar
    const progressPercent = (monthsCompleted / 12) * 100;
    document.getElementById("progressFill").style.width = `${progressPercent}%`;
    document.getElementById(
      "progressText"
    ).textContent = `${monthsCompleted}/12 months`;
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "16px 24px",
      borderRadius: "12px",
      color: "white",
      fontWeight: "500",
      zIndex: "1000",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease-in-out",
      maxWidth: "300px",
    });

    // Set background color based on type
    const colors = {
      success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      error: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      info: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    };
    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  loadUserData() {
    const saved = localStorage.getItem("vaultScoreData");
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      totalDeposited: 0,
      deposits: {},
      startDate: null,
    };
  }

  saveUserData() {
    localStorage.setItem("vaultScoreData", JSON.stringify(this.userData));
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.vaultScoreApp = new VaultScoreApp();
});
