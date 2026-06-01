fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'hvaharpal@gmail.com', password: 'iva123' })
}).then(res => res.json().then(data => console.log(res.status, data))).catch(err => console.error(err));
