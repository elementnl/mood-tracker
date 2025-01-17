let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const dayContainer = document.querySelector(".calendar-dates");
const currDateElement = document.querySelector(".calendar-current-date");
const navigationButtons = document.querySelectorAll(
  ".calendar-navigation span"
);

const months = [
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

// Store fetched moods
let moodData = [];

// Define mood colors and icons
const moodConfig = {
  5: { icon: "fa-face-smile-beam", color: "#129643" },
  4: { icon: "fa-face-smile", color: "#94cc5c" },
  3: { icon: "fa-face-meh", color: "#d4ca3f" },
  2: { icon: "fa-face-frown", color: "#f79719" },
  1: { icon: "fa-face-angry", color: "#e30b0b" },
};

// Function to generate calendar
const generateCalendar = () => {
  dayContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const lastDay = new Date(year, month, lastDate).getDay();
  const prevMonthLastDate = new Date(year, month, 0).getDate();

  currDateElement.innerText = `${months[month]} ${year}`;

  // Add previous month's last dates (inactive)
  for (let i = firstDay; i > 0; i--) {
    const inactiveDate = document.createElement("li");
    inactiveDate.classList.add("inactive");
    inactiveDate.innerText = prevMonthLastDate - i + 1;
    dayContainer.appendChild(inactiveDate);
  }

  // Add current month's dates
  for (let i = 1; i <= lastDate; i++) {
    const dateElement = document.createElement("li");
    dateElement.innerText = i;

    // Add `data-date` in the format YYYY-MM-DD
    const formattedDate = `${year}-${String(month + 1).padStart(
      2,
      "0"
    )}-${String(i).padStart(2, "0")}`;
    dateElement.setAttribute("data-date", formattedDate);

    if (
      i === date.getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()
    ) {
      dateElement.classList.add("active");
    }
    dayContainer.appendChild(dateElement);
  }

  // Add next month's first dates (inactive)
  for (let i = lastDay; i < 6; i++) {
    const inactiveDate = document.createElement("li");
    inactiveDate.classList.add("inactive");
    inactiveDate.innerText = i - lastDay + 1;
    dayContainer.appendChild(inactiveDate);
  }
};

// Helper function to apply mood colors
const applyMoodColors = () => {
  moodData.forEach(({ day, mood }) => {
    const dateElement = document.querySelector(
      `.calendar-dates li[data-date="${day}"]`
    );

    if (dateElement) {
      dateElement.style.backgroundColor = moodConfig[mood].color;
      dateElement.style.color = "#fff"; // Make text white for visibility
      dateElement.classList.add("has-mood"); // Add a class for interaction
    }
  });
};

// Generate calendar with moods
const generateCalendarWithMoods = () => {
  generateCalendar(); // Generate the calendar
  applyMoodColors(); // Apply mood colors
};

// Event listener for navigation buttons
navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const currentDate = new Date();

    if (button.id === "calendar-prev") {
      month -= 1;
    } else if (
      button.id === "calendar-next" &&
      (year < currentDate.getFullYear() || month < currentDate.getMonth())
    ) {
      month += 1;
    }

    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }

    generateCalendarWithMoods(); // Use the new function
  });
});

// Initialize the calendar
document.addEventListener("DOMContentLoaded", () => {
  const calendarContainer = document.querySelector(".calendar-container");
  const calendarDates = document.querySelector(".calendar-dates");

  // Fetch moods once and store them
  fetch("/api/moods")
    .then((response) => response.json())
    .then((moods) => {
      moodData = moods; // Store fetched moods
      generateCalendarWithMoods(); // Generate initial calendar with moods
    })
    .catch((error) => {
      console.error("Error fetching moods:", error);
    });

  // Handle click on a date
  calendarDates.addEventListener("click", (e) => {
    if (e.target.classList.contains("has-mood")) {
      const date = e.target.getAttribute("data-date");

      // Fetch mood details for the selected date
      fetch(`/api/moods/${date}`)
        .then((response) => response.json())
        .then((moodEntry) => {
          showMoodDetails(moodEntry);
        })
        .catch((error) => {
          console.error("Error fetching mood for date:", error);
          alert("Failed to fetch mood details.");
        });
    }
  });

  // Function to display mood details
  function showMoodDetails({ day, mood, text_input }) {
    // Parse the `day` string (YYYY-MM-DD) into a local date
    const [year, month, date] = day.split("-").map(Number);
    const formattedDate = new Date(year, month - 1, date).toLocaleDateString(
      "en-US",
      {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      }
    );

    calendarContainer.innerHTML = `
      <div class="mood-details">
        <h2>Mood for ${formattedDate}</h2><br>
        <p>
          <i class="fas ${moodConfig[mood].icon}" style="color: ${
      moodConfig[mood].color
    }; font-size: 2rem;"></i>
        </p><br>
        <p><strong>Note:</strong> ${text_input || "No note added."}</p><br>
        <button id="editMood" class="edit-button">Edit Mood</button>
      </div>
    `;

    document.getElementById("editMood").addEventListener("click", () => {
      showEditForm(day, mood, text_input, formattedDate);
    });
  }

  // Function to display edit form
  function showEditForm(day, currentMood, currentText, formattedDate) {
    calendarContainer.innerHTML = `
      <div class="mood-form">
        <h2>Edit Mood for ${formattedDate}</h2>
        <form id="moodForm">
          <div class="mood-icons">
            ${Object.entries(moodConfig)
              .map(
                ([key, { icon, color }]) => `
                  <input type="radio" id="mood${key}" name="mood" value="${key}" ${
                  currentMood == key ? "checked" : ""
                } required />
                  <label for="mood${key}" class="icon-label" style="color: ${color};">
                    <i class="fas ${icon}"></i>
                  </label>
                `
              )
              .join("")}
          </div>
  
          <label for="text_input">Edit Note (Optional):</label>
          <textarea id="text_input" name="text_input" maxlength="150" placeholder="Write a note about your day...">${
            currentText || ""
          }</textarea>
          <span id="charCount" class="char-counter">${
            (currentText || "").length
          }/150</span>
  
          <button type="submit">Update</button>
        </form>
      </div>
    `;

    // Character counter functionality
    const noteInput = document.getElementById("text_input");
    const charCounter = document.getElementById("charCount");
    const maxLength = 150;

    noteInput.addEventListener("input", () => {
      const typed = noteInput.value.length;
      charCounter.textContent = `${typed}/${maxLength}`;

      if (typed > maxLength) {
        charCounter.classList.add("exceeded");
      } else {
        charCounter.classList.remove("exceeded");
      }
    });

    // Submit event listener
    const moodForm = document.getElementById("moodForm");
    moodForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const updatedMood = document.querySelector(
        "input[name='mood']:checked"
      ).value;
      const updatedText = noteInput.value;

      // Send the updated data to the server
      fetch(`/api/moods/${day}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `mood=${updatedMood}&text_input=${encodeURIComponent(
          updatedText
        )}`,
      })
        .then((response) => {
          if (response.ok) {
            window.location.reload();
          } else {
            alert("Failed to update mood. Please try again.");
          }
        })
        .catch((error) => {
          console.error("Error updating mood:", error);
          alert("An unexpected error occurred.");
        });
    });
  }
});
