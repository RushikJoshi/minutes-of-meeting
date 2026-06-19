const fs = require('fs');
const path = require('path');

const directoriesToSearch = [
  path.join(__dirname, '../server'),
  path.join(__dirname, '../client/src'),
];

const replacements = [
  { from: /workspaceId/g, to: 'organizationId' },
  { from: /workspace/g, to: 'organization' },
  { from: /Workspace/g, to: 'Organization' },
  { from: /WORKSPACES/g, to: 'ORGANIZATIONS' },
  { from: /workspaces/g, to: 'organizations' }
];

const ignoreFiles = ['node_modules', '.git', '.env', 'package.json', 'package-lock.json', 'scratch', 'build', 'dist'];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  
  for (const { from, to } of replacements) {
    newContent = newContent.replace(from, to);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (ignoreFiles.includes(file)) continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (stat.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
      processFile(filePath);
    }
  }
}

for (const dir of directoriesToSearch) {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  }
}

// Rename the model file
const oldModelPath = path.join(__dirname, '../server/models/Workspace.js');
const newModelPath = path.join(__dirname, '../server/models/Organization.js');
if (fs.existsSync(oldModelPath)) {
  fs.renameSync(oldModelPath, newModelPath);
  console.log('Renamed server/models/Workspace.js to Organization.js');
}

// Rename routes file
const oldRoutesPath = path.join(__dirname, '../server/routes/workspaceRoutes.js');
const newRoutesPath = path.join(__dirname, '../server/routes/organizationRoutes.js');
if (fs.existsSync(oldRoutesPath)) {
  fs.renameSync(oldRoutesPath, newRoutesPath);
  console.log('Renamed server/routes/workspaceRoutes.js to organizationRoutes.js');
}

// Rename controllers file
const oldControllerPath = path.join(__dirname, '../server/controllers/workspaceController.js');
const newControllerPath = path.join(__dirname, '../server/controllers/organizationController.js');
if (fs.existsSync(oldControllerPath)) {
  fs.renameSync(oldControllerPath, newControllerPath);
  console.log('Renamed server/controllers/workspaceController.js to organizationController.js');
}

console.log('Done.');
