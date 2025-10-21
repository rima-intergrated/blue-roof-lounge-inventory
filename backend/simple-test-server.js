const express = require('express');
const app = express();
const PORT = 5000;

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});
