app.post('/api/requirements', (req, res) => {
  console.log('📥 REQUEST BODY:', JSON.stringify(req.body, null, 2));
  console.log('📋 FIELD NAMES:', Object.keys(req.body));
  // ... rest of your code
});
