const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: ['http://localhost:55000', 'http://dowscopemedia.ca', 'http://localhost:8080'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/status', (req, res) => {
  exec('systemctl is-active godot-server.service', (err, stdout, stderr) => {
    if (err) {
      if (stdout.trim() === "inactive") {
        return res.json({ status: "inactive" });
      }
      console.error(`Error checking service: ${err.message}`);
      return res.json({ status: `Error: ${err.message}` });
    }
    if (stderr) {
      console.error(`Service stderr:  ${err.message}`);
      return res.json({status: `Error: ${stderr}`});
    }
    res.json({status: stdout.trim()});
  });
});

app.listen(55001, () => console.log("Running on port: 55001"));