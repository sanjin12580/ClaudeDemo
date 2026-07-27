const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1', port: 8080, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve(JSON.parse(buf)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const tests = [
    { service: 'express_saver', type: 'non_document', weight: 301, destination: '美国' },
    { service: 'expedited',     type: 'non_document', weight: 301, destination: '美国' },
    { service: 'express_saver', type: 'document',     weight: 5,   destination: '日本' },
    { service: 'express_saver', type: 'non_document', weight: 15,  destination: '韩国' },
    { service: 'expedited',     type: 'non_document', weight: 80,  destination: '欧洲' },
  ];

  for (const t of tests) {
    const res = await post('/api/shipping/calculate', t);
    console.log(`\n--- ${t.service} | ${t.type} | ${t.weight}kg | ${t.destination} ---`);
    console.log(JSON.stringify(res, null, 2));
  }
}

main().catch(console.error);
