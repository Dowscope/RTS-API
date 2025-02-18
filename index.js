const express = require('express');
const { exec } = require('child_process');

const app = express();

app.get('/status', (req, res) => {
  exec('systemctl is-active godot-server.service', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error checking service ${err.message}`);
      return res.json({status: 'unknown'});
    }
    if (stderr) {
      console.error(`Service stderr:  ${err.message}`);
      return res.json({status: 'unknown'});
    }
    res.json({status: stdout.trim()});
  });
});

app.listen(55001, () => console.log("Running on port: 55001"));