const fs = require('fs');
const seedData = JSON.parse(fs.readFileSync('./data/routes.json', 'utf8'));
(async () => {
  try {
    const loginRes = await fetch('http://localhost:8000/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.edu', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    for(const route of seedData) {
      await fetch('http://localhost:8000/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': 'token=' + token },
        body: JSON.stringify(route)
      });
    }
    console.log('Seeded via API successfully');
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
