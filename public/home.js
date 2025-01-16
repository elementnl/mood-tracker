document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("dashboard");

  fetch("/api/mood-today")
    .then((response) => response.json())
    .then((data) => {
      if (!data.submitted) {
        // Insert form into the dashboard
        dashboard.innerHTML = `
          <div class="mood-form">
            <h2>Submit Your Mood for Today</h2>
            <form id="moodForm">
              <div class="mood-icons">
                <input type="radio" id="mood5" name="mood" value="5" required />
                <label for="mood5" class="icon-label" style="color: #129643;">
                  <i class="fas fa-face-smile-beam"></i>
                </label>

                <input type="radio" id="mood4" name="mood" value="4" required />
                <label for="mood4" class="icon-label" style="color: #94cc5c;">
                  <i class="fas fa-face-smile"></i>
                </label>

                <input type="radio" id="mood3" name="mood" value="3" required />
                <label for="mood3" class="icon-label" style="color: #d4ca3f;">
                  <i class="fas fa-face-meh"></i>
                </label>

                <input type="radio" id="mood2" name="mood" value="2" required />
                <label for="mood2" class="icon-label" style="color: #f79719;">
                  <i class="fas fa-face-frown"></i>
                </label>

                <input type="radio" id="mood1" name="mood" value="1" required />
                <label for="mood1" class="icon-label" style="color: #e30b0b;">
                  <i class="fas fa-face-angry"></i>
                </label>
              </div>

              <label for="note">Add a Note (Optional):</label>
              <textarea id="note" name="note" maxlength="150" placeholder="Write a note about your day..."></textarea>
              <span id="charCount" class="char-counter">0/150</span>
              
              <button type="submit">Submit</button>
            </form>
          </div>
        `;

        // Character counter functionality
        const noteInput = document.getElementById("note");
        const charCounter = document.getElementById("charCount");
        const maxLength = 150;

        noteInput.addEventListener("input", () => {
          const typed = noteInput.value.length;
          charCounter.textContent = `${typed}/${maxLength}`;

          // Change color if exceeded
          if (typed > maxLength) {
            charCounter.classList.add("exceeded");
          } else {
            charCounter.classList.remove("exceeded");
          }
        });

        // Attach the event listener to the form
        const moodForm = document.getElementById("moodForm");
        moodForm.addEventListener("submit", (e) => {
          e.preventDefault(); // Prevent default form submission

          const mood = document.querySelector(
            "input[name='mood']:checked"
          ).value;
          const note = document.getElementById("note").value;

          // Send mood data to the server
          fetch("/submit-mood", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `mood=${mood}&text_input=${encodeURIComponent(note)}`,
          }).then((response) => {
            if (response.ok) {
              window.location.reload(); // Reload the page on success
            } else {
              alert("Failed to submit mood. Please try again.");
            }
          });
        });
      } else {
        // Map mood rating to icons and colors
        const moodIcons = {
          5: { icon: "fa-face-smile-beam", color: "#129643" },
          4: { icon: "fa-face-smile", color: "#94cc5c" },
          3: { icon: "fa-face-meh", color: "#d4ca3f" },
          2: { icon: "fa-face-frown", color: "#f79719" },
          1: { icon: "fa-face-angry", color: "#e30b0b" },
        };

        const mood = moodIcons[data.mood] || {
          icon: "fa-question",
          color: "gray",
        };

        // Display the mood summary with Edit button
        dashboard.innerHTML = `
          <div class="mood-summary">
            <h2>Today's Mood</h2><br>
            <p>
              <i class="fas ${mood.icon}" style="color: ${
          mood.color
        }; font-size: 3rem;"></i>
            </p><br>
            <p><strong>Note:</strong> ${data.text || "No note added."}</p><br>
            <button id="editMood" class="edit-button">Edit Mood</button>
          </div>
        `;

        // Attach the event listener to the Edit button
        document.getElementById("editMood").addEventListener("click", () => {
          // Render the form prefilled with existing data
          dashboard.innerHTML = `
            <div class="mood-form">
              <h2>Edit Your Mood for Today</h2>
              <form id="moodForm">
                <div class="mood-icons">
                  ${Object.entries(moodIcons)
                    .map(
                      ([key, { icon, color }]) => `
                      <input type="radio" id="mood${key}" name="mood" value="${key}" ${
                        data.mood == key ? "checked" : ""
                      } required />
                      <label for="mood${key}" class="icon-label" style="color: ${color};">
                        <i class="fas ${icon}"></i>
                      </label>
                    `
                    )
                    .join("")}
                </div>

                <label for="note">Edit Your Note (Optional):</label>
                <textarea id="note" name="note" maxlength="150" placeholder="Write a note about your day...">${
                  data.text || ""
                }</textarea>
                <span id="charCount" class="char-counter">${
                  (data.text || "").length
                }/150</span>
                
                <button type="submit">Update</button>
              </form>
            </div>
          `;

          // Reinitialize character counter
          const noteInput = document.getElementById("note");
          const charCounter = document.getElementById("charCount");

          noteInput.addEventListener("input", () => {
            const typed = noteInput.value.length;
            charCounter.textContent = `${typed}/150`;

            if (typed > 150) {
              charCounter.classList.add("exceeded");
            } else {
              charCounter.classList.remove("exceeded");
            }
          });

          const moodForm = document.getElementById("moodForm");
          moodForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const updatedMood = document.querySelector(
              "input[name='mood']:checked"
            ).value;
            const updatedNote = noteInput.value;

            const today = new Date().toISOString().split("T")[0]; // Get today's date

            // Send the updated data to the correct endpoint
            fetch(`/api/moods/${today}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: `mood=${updatedMood}&text_input=${encodeURIComponent(
                updatedNote
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
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching mood data:", error);
      dashboard.innerHTML = `<p>Error loading your dashboard. Please try again later.</p>`;
    });
});
