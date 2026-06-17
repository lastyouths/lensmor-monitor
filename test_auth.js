fetch('http://localhost:3000/api/analyze', { method: 'POST', body: JSON.stringify({url: "http://localhost:3000/sandbox"}) }).then(console.log)
