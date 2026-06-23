// Import required Node.js modules
const express = require("express");
const cors = require("cors");
const path = require("path");

// Create an Express application instance
const app = express();

// Define the port used by the local server
const PORT = 3000;

// Enable Cross-Origin Resource Sharing (CORS)
// so the Chrome extension can access this server
app.use(cors());

// Serve the sitelist JSON file at /sitelist.json
app.get("/sitelist.json", (req, res) => {
  res.sendFile(path.join(__dirname, "sitelist.json"));
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});