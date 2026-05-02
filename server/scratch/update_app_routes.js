const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../client/src/App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('import Profile')) {
  content = content.replace(
    'import VisitorVerification from "./pages/VisitorVerification";',
    'import VisitorVerification from "./pages/VisitorVerification";\nimport Profile from "./pages/Profile";'
  );
}

// Add route
if (!content.includes('path="/profile"')) {
  content = content.replace(
    '<Route path="/settings" element={<Settings />} />',
    '<Route path="/settings" element={<Settings />} />\n            <Route path="/profile" element={<Profile />} />'
  );
}

fs.writeFileSync(filePath, content);
console.log('App.jsx updated successfully.');
