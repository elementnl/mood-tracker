const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (CSS, JS)

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Constants
const PASSWORD = process.env.PASSWORD;
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Routes
app.get("/", (req, res) => {
  if (req.cookies.session) {
    return res.redirect("/home");
  }
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === PASSWORD) {
    res.cookie("session", "active", { maxAge: SESSION_DURATION });
    return res.redirect("/home");
  }

  res.redirect("/?error=incorrect-password");
});

app.get("/home", (req, res) => {
  if (!req.cookies.session) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "views", "home.html"));
});

// Fetch today's mood
app.get("/api/mood-today", async (req, res) => {
  // Simulate session validation
  const sessionExists = true; // Replace with your session validation logic if needed

  if (!sessionExists) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let todayEST = moment().tz("America/New_York").format("YYYY-MM-DD");

  try {
    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("day", todayEST)
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignore 'single()' no rows found error
      console.error("Supabase query error:", error.message);
      return res.status(500).json({ error: "Database query error" });
    }

    if (!data) {
      return res.json({ submitted: false });
    }

    res.json({
      submitted: true,
      mood: data.mood,
      text: data.text_input || null,
    });
  } catch (err) {
    console.error("Unexpected server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit a new mood
const moment = require("moment-timezone");

app.post("/submit-mood", async (req, res) => {
  let todayEST = moment().tz("America/New_York").format("YYYY-MM-DD"); // Get current date in EST

  const { mood, text_input } = req.body;

  const { error } = await supabase.from("moods").insert([
    {
      day: todayEST,
      mood: parseInt(mood, 10),
      text_input: text_input || null,
    },
  ]);

  if (error) {
    console.error("Error inserting mood:", error.message);
    return res.status(500).send("Failed to submit mood.");
  }

  res.status(200).send("Mood submitted successfully.");
});

// Update mood for a specific date
app.post("/api/moods/:date", async (req, res) => {
  const { date } = req.params;
  const { mood, text_input } = req.body;

  const { error } = await supabase
    .from("moods")
    .update({ mood: parseInt(mood, 10), text_input: text_input || null })
    .eq("day", date);

  if (error) {
    console.error("Error updating mood for date:", error.message);
    return res.status(500).send("Failed to update mood.");
  }

  res.status(200).send("Mood updated successfully.");
});

// Get mood for certain date
app.get("/api/moods/:date", async (req, res) => {
  const { date } = req.params;

  const { data, error } = await supabase
    .from("moods")
    .select("*")
    .eq("day", date)
    .single();

  if (error) {
    console.error("Error fetching mood for date:", error.message);
    return res.status(500).send("Failed to fetch mood.");
  }

  if (!data) {
    return res.status(404).send("No mood entry for this date.");
  }

  res.json(data);
});

// Fetch all moods
app.get("/api/moods", async (req, res) => {
  const { data, error } = await supabase.from("moods").select("*");

  if (error) {
    console.error("Error fetching moods:", error.message);
    return res.status(500).send("Internal server error.");
  }

  res.json(data);
});

// Analytics: Overall mood
app.get("/api/analytics/overall-mood", async (req, res) => {
  try {
    // Fetch all mood entries
    const { data, error } = await supabase.from("moods").select("mood");

    if (error) {
      console.error("Supabase query error:", error.message);
      return res.status(500).json({ error: "Database query error" });
    }

    if (!data || data.length === 0) {
      return res.json({ averageMood: null, message: "No mood entries found." });
    }

    // Calculate the average mood
    const totalMoods = data.reduce((sum, row) => sum + row.mood, 0);
    const averageMood = totalMoods / data.length;

    res.json({ averageMood: averageMood.toFixed(2) }); // Return average to 2 decimal places
  } catch (err) {
    console.error("Unexpected server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Analytics: Mood distribution
app.get("/api/analytics/mood-distribution", async (req, res) => {
  try {
    // Query to group by mood and count the occurrences
    const { data, error } = await supabase.rpc("mood_distribution");

    if (error) {
      console.error("Supabase query error:", error.message);
      return res.status(500).json({ error: "Database query error" });
    }

    if (!data || data.length === 0) {
      return res.json({ distribution: [], message: "No mood entries found." });
    }

    res.json({ distribution: data });
  } catch (err) {
    console.error("Unexpected server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Analytics: Streak
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

    // Convert all stored dates to EST before streak calculation
    const dates = data.map((entry) =>
      moment(entry.day).tz("America/New_York").format("YYYY-MM-DD")
    );

    const streak = calculateStreak(dates);

    res.json({ streak });
  } catch (err) {
    console.error("Unexpected server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to calculate streak
function calculateStreak(dates) {
  if (!dates.length) return 0;

  let streak = 0;
  let today = moment().tz("America/New_York").startOf("day"); // Get today's date in EST
  let currentDate = today.clone();

  for (const dateStr of dates) {
    let entryDate = moment(dateStr).tz("America/New_York").startOf("day");

    if (entryDate.isSame(currentDate, "day")) {
      // If it matches today or the expected previous day, continue the streak
      streak++;
      currentDate.subtract(1, "day"); // Move to the previous day for the next comparison
    } else if (entryDate.isBefore(currentDate, "day")) {
      // If there is a gap in the streak, break
      break;
    }
  }

  return streak;
}

app.get("/calendar", (req, res) => {
  if (!req.cookies.session) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "views", "calendar.html"));
});

app.get("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/");
});

app.get("/stats", (req, res) => {
  if (!req.cookies.session) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "views", "stats.html"));
});

app.get("/api/message", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("messages") // Ensure the table name is correct
      .select("message")
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase query error:", error.message);
      return res.status(500).json({ error: "Database query error" });
    }

    if (!data || data.length === 0) {
      return res.json({ message: null }); // No message to display
    }

    res.json({ message: data[0].message }); // Fix: Access the first item in the array
  } catch (err) {
    console.error("Unexpected server error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
