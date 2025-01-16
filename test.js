require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = 3000;

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Route to fetch the current streak
app.get("/api/analytics/streak", async (req, res) => {
  try {
    // Query to get all mood entry dates
    const { data, error } = await supabase
      .from("moods")
      .select("day")
      .order("day", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error.message);
      return res.status(500).json({ error: "Database query error" });
    }

    if (!data || data.length === 0) {
      return res.json({ streak: 0, message: "No mood entries found." });
    }

    // Calculate streak
    const dates = data.map((entry) => entry.day);
    const streak = calculateStreak(dates);

    res.json({ streak });
  } catch (err) {
    console.error("Unexpected server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to calculate streak
function calculateStreak(dates) {
  let streak = 0;
  let currentDate = new Date();

  for (const date of dates) {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    const expectedDate = currentDate.toISOString().split("T")[0];

    if (formattedDate === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
    } else {
      break;
    }
  }

  return streak;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});