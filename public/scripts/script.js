

async function DailyFacts() {
  try {
    const response = await fetch("/api/quote");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    document.getElementById("daily-quote").innerText = `"${data.text}"`;
    document.getElementById("daily-author").innerText = `— ${data.source} 😄`;
  } catch (err) {
    document.getElementById("daily-quote").innerText = "Fact unavailable 😔";
    document.getElementById("daily-author").innerText = "";
    console.error("Failed to fetch fact:", err);
  }
}




async function loadCountry() {
  const countrySelect = document.getElementById('country');

  try {
    const response = await fetch('/api/countries');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const countries = await response.json();

    if (countrySelect) {
      countrySelect.innerHTML = '<option value="">Select a country</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading countries:', error);
    if (countrySelect) {
      countrySelect.innerHTML = '<option value="">Failed to load countries</option>';
    }
  }
}


document.addEventListener("DOMContentLoaded", DailyFacts());
document.addEventListener("DOMContentLoaded", loadCountry);



//attendance
const subjectSelect01 = document.getElementById('attend-subject-select-01');
const selectedSubject01Input = document.getElementById('selectedSubject01');
const rowsContainer = document.getElementById('attend-rows-container');


// Update hidden input when subject changes
if (subjectSelect01) {
  subjectSelect01.addEventListener('change', function () {
    selectedSubject01Input.value = this.value;
  });
}

// Add attendance row
function addRow() {
  const row = document.createElement('div');
  row.classList.add('attend-row');
  row.innerHTML = `
       <input type="date" name="dates[]" class="attend-date" required />

<select name="statuses[]" class="attend-status" required>
  <option value="present">✅ Present</option>
  <option value="absent">❌ Absent</option>
</select>

      

    `;
  rowsContainer.appendChild(row);
}

const subject_blocks = document.querySelectorAll(".subject-block");
subject_blocks.forEach(block => {
  block.addEventListener("click", () => {
    const attend_table = block.querySelector(".attend-table")
    if (attend_table) {
      attend_table.style.display = attend_table.style.display === "block" ? "none" : "block";
    }

  });
});



















//countdown

function updateCountdown(card, due) {
  const now = Date.now();
  // due = due.getTime()
  let diff = due - now;
  if (diff < 0) diff = 0;

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  console.log(due)

  if (card) {
    const daysEl = card.querySelector(".days");
    const hoursEl = card.querySelector(".hours");
    const minutesEl = card.querySelector(".minutes");
    const secondsEl = card.querySelector(".seconds");

    if (daysEl) daysEl.innerText = days;
    if (hoursEl) hoursEl.innerText = hours;
    if (minutesEl) minutesEl.innerText = minutes;
    if (secondsEl) secondsEl.innerText = seconds;
  }
}


document.querySelectorAll(".count-card").forEach(card => {
  const rawDue = card.dataset.due; // This is a string from HTML
  const due = new Date(rawDue);    // Convert once to Date object

  if (isNaN(due.getTime())) {
    return; // Skip this card
  }

  const dueTime = due.getTime(); // Get time in ms

  // Use the fixed timestamp for countdown
  setInterval(() => updateCountdown(card, dueTime), 1000);
  updateCountdown(card, dueTime);
});



//to add new
// Elements
const add_new_btn = document.querySelector(".count-add-btn");
const add_new_h3 = document.querySelector("#count---click");
const reminderForm = document.querySelector("#count--add-reminder");

let isFormVisible = false;
// Toggle function
const open_close = () => {
  console.log("hello")
  isFormVisible = !isFormVisible;
  reminderForm.style.display = isFormVisible ? "flex" : "none";
};

// Event listeners
if (add_new_btn && add_new_h3) {

  add_new_btn.addEventListener("click", open_close);
  add_new_h3.addEventListener("click", open_close);

}



let ctx = document.getElementById("moneytracker-expense-chart");

async function renderExpenseChart() {
  try {
    const response = await fetch('/api/user/money_manager');
    if (!response.ok) throw new Error('Failed to fetch data');

    const data = await response.json();

    const months_data = data.map(item => item.month);
    const expenses_data = data.map(item => item.expense);
    const budgets_data = data.map(item => item.budget);
    const savings_data = data.map(item => item.balance); // Assuming balance = savings

    ctx = ctx.getContext('2d')

    // 🌈 Create gradient for Expense Line
    const expenseGradient = ctx.createLinearGradient(0, 0, 0, 300);
    expenseGradient.addColorStop(0, "rgba(239, 68, 68, 0.4)");
    expenseGradient.addColorStop(1, "rgba(239, 68, 68, 0.05)");

    // 🌈 Create gradient for Budget Line
    // Yellow gradient for budget
    const budgetGradient = ctx.createLinearGradient(0, 0, 0, 400);
    budgetGradient.addColorStop(0, "rgba(250, 204, 21, 0.4)");  // bright yellow top
    budgetGradient.addColorStop(1, "rgba(250, 204, 21, 0)");


    // 🌈 Create gradient for Saving Line
    const savingsGradient = ctx.createLinearGradient(0, 0, 0, 400);
    savingsGradient.addColorStop(0, "rgba(38, 119, 68, 0.3)"); // Light green at top
    savingsGradient.addColorStop(1, "rgba(67, 197, 34, 0)");   // Fade to transparent
    new Chart(ctx, {
      type: "line",
      data: {
        labels: months_data,
        datasets: [
          {
            label: "Monthly Savings",
            data: savings_data,
            backgroundColor: savingsGradient,    // 🌿 Green fill
            borderColor: "#22c55e",              // 🍃 Green line
            borderWidth: 2,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#22c55e",
            pointRadius: 5,
            fill: true,
            tension: 0.45,
            hoverBorderWidth: 3,
          },
          {
            label: "Monthly Expense",
            data: expenses_data,
            backgroundColor: expenseGradient,
            borderColor: "#ef4444",
            borderWidth: 2.5,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#ef4444",
            pointRadius: 5,
            fill: true,
            tension: 0.45,
            hoverBorderWidth: 3,
          },
          {
            label: "Monthly Budget",
            data: budgets_data,
            backgroundColor: budgetGradient,
            borderColor: "#facc15",
            borderWidth: 2,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#facc15",
            pointRadius: 5,
            fill: true,
            tension: 0.45,
            hoverBorderWidth: 3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "Months", color: "#ccc" },
            ticks: { color: "#eee" },
            grid: { color: "#444" }
          },
          y: {
            title: { display: true, text: "Amount in ₹", color: "#ccc" },
            ticks: { color: "#eee" },
            beginAtZero: true,
            grid: { color: "#444" }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: { color: "#eee", boxWidth: 12 }
          },
          title: {
            display: true,
            text: "📊 Monthly Budget vs Expense",
            font: { size: 18 },
            color: "#fff"
          },
          tooltip: {
            enabled: true,
            backgroundColor: "#1f2937", // dark gray
            titleColor: "#22c55e",
            bodyColor: "#fff"
          }
        },
        animation: {
          duration: 5000,
          easing: "easeOutQuart"
        }
      }
    });
  } catch (err) {
    console.error("Chart load error:", err);
  }
}

if (ctx) {

  document.addEventListener("DOMContentLoaded", renderExpenseChart);

}