const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(process.env.USERPROFILE, 'Desktop', '全航线定制折扣-基于2026年公布价-S+iCDV.xlsx');
const wb = XLSX.readFile(filePath);

const destinations = ['美国','印度','韩国','新加坡','马来西亚','菲律宾','印度尼西亚','日本','越南/泰国','澳大利亚/新西兰','加拿大/墨西哥/波多黎各','欧洲'];

function parseSheet(sheetName, serviceTypeId) {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: null});
  const results = [];
  let currentItemType = null;
  let sectionRows = [];

  function flushSection() {
    if (sectionRows.length === 0 || currentItemType === null) return;

    if (currentItemType === 0) {
      // 文件: each row is FIXED tier
      sectionRows.forEach(row => {
        for (let d = 0; d < destinations.length; d++) {
          const price = row.prices[d];
          if (price !== null && typeof price === 'number') {
            results.push({
              serviceTypeId, itemType: 0, pricingMode: 'FIXED',
              weightMin: row.weight, weightMax: row.weight,
              destId: d + 1, price: Math.round(price * 10000) / 10000
            });
          }
        }
      });
    } else {
      // 非文件: split into 0-20kg (FIXED) and 21kg+ (PER_KG)
      const fixedRows = sectionRows.filter(r => r.weight <= 20);
      const perKgRows = sectionRows.filter(r => r.weight > 20);

      // 0-20kg: FIXED tiers
      fixedRows.forEach(row => {
        for (let d = 0; d < destinations.length; d++) {
          const price = row.prices[d];
          if (price !== null && typeof price === 'number') {
            results.push({
              serviceTypeId, itemType: 1, pricingMode: 'FIXED',
              weightMin: row.weight, weightMax: row.weight,
              destId: d + 1, price: Math.round(price * 10000) / 10000
            });
          }
        }
      });

      // 21kg+: PER_KG tiers - each Excel row is a separate tier boundary
      if (perKgRows.length > 0) {
        for (let d = 0; d < destinations.length; d++) {
          for (let i = 0; i < perKgRows.length; i++) {
            const rate = perKgRows[i].prices[d];
            if (rate === null || typeof rate !== 'number') continue;

            const wMin = perKgRows[i].weight;
            let wMax;
            if (i < perKgRows.length - 1) {
              wMax = perKgRows[i + 1].weight - 1;
            } else {
              wMax = 99999; // last tier, no upper limit
            }

            results.push({
              serviceTypeId, itemType: 1, pricingMode: 'PER_KG',
              weightMin: wMin, weightMax: wMax,
              destId: d + 1, price: Math.round(rate * 10000) / 10000
            });
          }
        }
      }
    }
    sectionRows = [];
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    if (row[0] === '文件' || row[0] === '非文件') {
      flushSection();
      currentItemType = row[0] === '文件' ? 0 : 1;
      if (row[1] !== null && row[1] !== '' && typeof row[1] === 'number') {
        sectionRows.push({ weight: row[1], prices: row.slice(2, 2 + destinations.length) });
      }
      continue;
    }

    if (currentItemType === null) continue;

    let weight;
    if (typeof row[1] === 'number') {
      weight = row[1];
    } else if (typeof row[1] === 'string' && row[1].includes('以上')) {
      weight = 300;
    } else {
      continue;
    }

    sectionRows.push({ weight, prices: row.slice(2, 2 + destinations.length) });
  }
  flushSection();

  return results;
}

const allRates = [
  ...parseSheet('Express Saver速快-出口', 1),
  ...parseSheet('Expedited快捷-出口', 2)
];

// Generate SQL
let sql = '-- ============================================\n';
sql += '-- 快递费率数据 INSERT (阶梯计价版)\n';
sql += '-- 0-20kg: FIXED 固定票价\n';
sql += '-- 21kg+:  PER_KG 单价 x 段重量, 阶梯累加\n';
sql += '-- Total: ' + allRates.length + ' rows\n';
sql += '-- ============================================\n\n';

const batchSize = 1000;
for (let i = 0; i < allRates.length; i += batchSize) {
  const batch = allRates.slice(i, i + batchSize);
  sql += 'INSERT INTO ups_shipping_rate (service_type_id, item_type, pricing_mode, weight_min, weight_max, price, destination_id) VALUES\n';
  sql += batch.map((r, idx) => {
    const comma = idx < batch.length - 1 ? ',' : ';';
    const wMax = r.weightMax === 99999 ? '99999' : r.weightMax;
    return '  (' + r.serviceTypeId + ', ' + r.itemType + ', \'' + r.pricingMode + '\', ' + r.weightMin + ', ' + wMax + ', ' + r.price + ', ' + r.destId + ')' + comma;
  }).join('\n');
  sql += '\n\n';
}

const outPath = path.join(process.env.USERPROFILE, 'ClaudeDemo', 'shipping-rate', 'sql', 'insert_rates.sql');
fs.writeFileSync(outPath, sql, 'utf8');

// Summary
const fixed = allRates.filter(r => r.pricingMode === 'FIXED');
const perKg = allRates.filter(r => r.pricingMode === 'PER_KG');
console.log('Total: ' + allRates.length + ' rows');
console.log('  FIXED: ' + fixed.length + ' rows');
console.log('  PER_KG: ' + perKg.length + ' rows');

// Show US non-document PER_KG tiers
console.log('\n--- Express Saver 非文件 美国 PER_KG tiers ---');
allRates.filter(r => r.serviceTypeId === 1 && r.itemType === 1 && r.pricingMode === 'PER_KG' && r.destId === 1)
  .forEach(r => console.log('  ' + r.weightMin + '-' + (r.weightMax === 99999 ? 'inf' : r.weightMax) + 'kg: ' + r.price + '/kg'));

console.log('\n--- Expedited 非文件 美国 PER_KG tiers ---');
allRates.filter(r => r.serviceTypeId === 2 && r.itemType === 1 && r.pricingMode === 'PER_KG' && r.destId === 1)
  .forEach(r => console.log('  ' + r.weightMin + '-' + (r.weightMax === 99999 ? 'inf' : r.weightMax) + 'kg: ' + r.price + '/kg'));

// Verify: 301kg Expedited non-document US
console.log('\n--- Verify: Expedited non_document US 301kg ---');
const usTiers = allRates.filter(r => r.serviceTypeId === 2 && r.itemType === 1 && r.destId === 1);
let total = 0;
usTiers.forEach(r => {
  const weight = 301;
  if (r.pricingMode === 'FIXED') {
    if (weight >= r.weightMin && weight <= r.weightMax) {
      console.log('  FIXED ' + r.weightMin + '-' + r.weightMax + 'kg: ' + r.price);
      total += r.price;
    }
  } else {
    if (weight >= r.weightMin) {
      const wMax = Math.min(r.weightMax, weight);
      const kg = wMax - r.weightMin + 1;
      const cost = kg * r.price;
      console.log('  PER_KG ' + r.weightMin + '-' + (r.weightMax === 99999 ? 'inf' : r.weightMax) + 'kg: ' + kg + 'kg x ' + r.price + ' = ' + Math.round(cost*10000)/10000);
      total += cost;
    }
  }
});
console.log('  Total: ' + Math.round(total * 10000) / 10000 + ' (expected: 14023.1292)');
