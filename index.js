const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

/****************************************************
 * Multer Storage for RuleSets
 ***************************************************/

const rulesetsDir = '/home/smooth/.local/share/godot/app_userdata/Server/RuleSets';
const ruleset_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, rulesetsDir);
    },
    filename: (req, file, cb) => {
      const filepath = path.join(rulesetsDir, file.originalname);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      cb(null, file.originalname); // Save with the original filename
    }
});
const ruleset_upload = multer({ storage: ruleset_storage });

/****************************************************/

const logfilesDir = '/home/smooth/.local/share/godot/app_userdata/Server/datalogs';

app.use(cors({
  origin: ['http://localhost:55000', 'http://dowscopemedia.ca', 'http://localhost:8080'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/****************************************************
 * Get the status of the server
 ***************************************************/
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

/****************************************************
 * Reboot the SIM Service
 ***************************************************/
app.post('/reboot', (req, res) => {
  exec('systemctl restart godot-server.service', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error checking service: ${err.message}`);
      return res.json({ status: `Error: ${err.message}` });
    }
    if (stderr) {
      console.error(`Service stderr:  ${err.message}`);
      return res.json({status: `Error: ${stderr}`});
    }
    res.json({status: "success"});
  });
});

/****************************************************
 * Upload a RuleSet
 ***************************************************/
app.post('/upload_ruleset', ruleset_upload.single('file'), (req, res) => {
  if (!req.file) {
    console.log("UPLOAD RULESET: No file uploaded");
    return res.json({status: "Error: No file uploaded"});
  }
  res.json({status: "success", comment: `File ${req.file.originalname} uploaded successfully.`});
});

app.get('/rulesets', (req, res) => {
  try {
    const files = fs.readdirSync(rulesetsDir);

    if (!files) {
      return res.json({success: false, reason: "No files found in the RuleSets directory."});
    }
    
    const fileStats = files.map(f => {
      const stats = fs.statSync(path.join(rulesetsDir, f));
      if (stats.isFile()) {
        return {name: f, size: stats.size, modified: stats.mtime};
      }
    });

    res.json({success: true, files: fileStats});
  }
  catch (err) {
    res.json({success: false, reason: err.message});
  }
});

/****************************************************
 * Get RuleSet File
 ***************************************************/
app.get('/ruleset/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(rulesetsDir, filename);
  if (!fs.existsSync(filepath)) {
    return res.json({success: false, reason: "File not found"});
  }
  const file = fs.readFileSync(filepath);
  if (!file) {
    return res.json({success: false, reason: "Error reading file"});
  }
  res.json({success: true, file: file.toString('base64')});
});

/****************************************************
 * Get Log File
 ***************************************************/
app.get('/logfile/:filename', (req, res) => {
  const filename = req.params.filename;
  const sublogdir = filename.slice(-4);
  const filepath = path.join(logfilesDir, sublogdir, filename);
  if (!fs.existsSync(filepath)) {
    return res.json({success: false, reason: "File not found"});
  }
  console.log(filepath);
  const file = fs.readFileSync(filepath);
  if (!file) {
    return res.json({success: false, reason: "Error reading file"});
  }
  res.json({success: true, file: file});
});

app.listen(55001, () => console.log("Running on port: 55001"));