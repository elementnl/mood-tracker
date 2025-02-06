document.addEventListener("DOMContentLoaded", () => {
  const overallMoodIcon = document.getElementById("overallMoodIcon");
  const currentStreakElement = document.getElementById("currentStreak");

  // Fetch overall mood
  fetch("/api/analytics/overall-mood")
    .then((response) => response.json())
    .then(({ averageMood }) => {
      let moodIcon;
      let moodColor;

      if (averageMood <= 1) {
        moodIcon = "fa-face-angry";
        moodColor = "#e30b0b";
      } else if (averageMood <= 2) {
        moodIcon = "fa-face-frown";
        moodColor = "#f79719";
      } else if (averageMood <= 3) {
        moodIcon = "fa-face-meh";
        moodColor = "#d4ca3f";
      } else if (averageMood <= 4) {
        moodIcon = "fa-face-smile";
        moodColor = "#94cc5c";
      } else {
        moodIcon = "fa-face-smile-beam";
        moodColor = "#129643";
      }

      overallMoodIcon.classList.add("fas", moodIcon);
      overallMoodIcon.style.color = moodColor;
    })
    .catch((error) => {
      console.error("Error fetching overall mood:", error);
    });

  // Fetch mood distribution
  fetch("/api/analytics/mood-distribution")
    .then((response) => response.json())
    .then((data) => {
      console.log("Mood distribution API response:", data);

      const moodLabels = ["Very Bad", "Bad", "Okay", "Good", "Very Good"];
      const moodCounts = [0, 0, 0, 0, 0];

      const distribution = data.distribution || [];
      distribution.forEach(({ mood, count }) => {
        if (mood >= 1 && mood <= 5) {
          moodCounts[mood - 1] = count; // Map mood to the array index
        }
      });

      const existingChart = Chart.getChart("moodDistributionChart");
      if (existingChart) {
        existingChart.destroy();
      }

      new Chart(document.getElementById("moodDistributionChart"), {
        type: "pie",
        data: {
          labels: moodLabels,
          datasets: [
            {
              data: moodCounts,
              backgroundColor: [
                "#e30b0b",
                "#f79719",
                "#d4ca3f",
                "#94cc5c",
                "#129643",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    })
    .catch((error) => {
      console.error("Error fetching mood distribution:", error);
    });

  // Fetch current streak
  fetch("/api/analytics/streak")
    .then((response) => response.json())
    .then(({ streak }) => {
      const currentStreakElement = document.getElementById("currentStreak");
      currentStreakElement.textContent = `You’ve submitted moods for ${streak} consecutive day(s).`;
    })
    .catch((error) => {
      console.error("Error fetching streak:", error);
    });
});
