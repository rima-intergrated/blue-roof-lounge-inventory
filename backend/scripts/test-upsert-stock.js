/* One-off test script: POST to /api/stock to create and update a stock item, then verify supplier and computed fields.
   Usage: node backend/scripts/test-upsert-stock.js
*/

const fetch = global.fetch || require('node-fetch');
const PORT = process.env.PORT || 5000;
const BASE = `http://127.0.0.1:${PORT}/api`;

async function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function main(){
  try{
    console.log('Test upsert stock: using base URL', BASE);
    // Authentication: try to use TEST_AUTH_TOKEN first. If not present, try LOGIN / REGISTER flow
    let authToken = process.env.TEST_AUTH_TOKEN || null;
    const tryLogin = async () => {
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      if (!email || !password) return null;
      try {
        const resp = await fetch(`${BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const j = await resp.json();
        if (j && j.data && j.data.token) return j.data.token;
      } catch (err) {
        console.warn('Login attempt failed', err && err.message);
      }
      return null;
    };

    if (!authToken) {
      authToken = await tryLogin();
    }

    // If still no token, attempt to register a throwaway test user
    if (!authToken) {
      try {
        const rand = Math.floor(Math.random() * 100000);
        const username = `testuser_${rand}`;
        const email = `testuser_${rand}@example.invalid`;
        const password = `TestPass!${rand}`;
        console.log('No TEST_AUTH_TOKEN provided, attempting to register test user', email);
        const regResp = await fetch(`${BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const regJson = await regResp.json();
        if (regJson && regJson.data && regJson.data.token) {
          authToken = regJson.data.token;
          console.log('Registered test user and obtained token');
        } else {
          console.warn('Register did not return token; proceeding unauthenticated (likely to fail)');
        }
      } catch (err) {
        console.warn('Register attempt failed', err && err.message);
      }
    }

    // headers now defined below

    // 1) Create new stock (no _id)
    const uniqueSuffix = Date.now();
    const createPayload = {
      itemName: `TEST ITEM XYZ ${uniqueSuffix}`,
      itemId: `TEST-ITEM-${uniqueSuffix}`,
      orderQuantity: 10,
      costPrice: 50,
      sellingPrice: 80,
      supplierName: 'Test Supplier Inc',
      supplierContact: '0700123456'
    };

    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    // Ensure supplier exists via the simple supplier endpoint
    if (authToken) {
      try {
        const suppResp = await fetch(`${BASE}/suppliers/simple`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ supplierName: 'Test Supplier Inc', phoneNumber: '0700123456' })
        });
        const suppJson = await suppResp.json().catch(() => null);
        console.log('Ensure supplier response status', suppResp.status);
        console.log('Ensure supplier response body:', JSON.stringify(suppJson, null, 2));
      } catch (e) {
        console.warn('Could not ensure supplier exists:', e && e.message);
      }
    }

    const createResp = await fetch(`${BASE}/stock`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload)
    });
    const createJson = await createResp.json();
    console.log('Create response status', createResp.status);
    console.log('Create response body:', JSON.stringify(createJson, null, 2));

    if (!createJson || !createJson.data || !createJson.data.item){
      console.error('Create did not return an item; aborting');
      process.exit(1);
    }

    const created = createJson.data.item;
    const stockId = created._id;
    console.log('Created stock id:', stockId);

    // Wait a moment for DB indexes etc.
    await wait(500);

    // 2) Update the item using _id (simulate Save-to-Inventory update). Send numeric fields only (no itemName)
    const updatePayload = {
      _id: stockId,
      // Include itemName/itemId so the POST validation accepts this as an update in the one-off test.
      itemName: created.itemName,
      itemId: created.itemId,
      orderQuantity: 5,
      costPrice: 60,
      sellingPrice: 90,
      supplierName: 'Test Supplier Inc',
      supplierContact: '0700123456'
    };

    const updateResp = await fetch(`${BASE}/stock/byid/${stockId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });
    const updateJson = await updateResp.json();
    console.log('Update response status', updateResp.status);
    console.log('Update response body:', JSON.stringify(updateJson, null, 2));

    // 3) Fetch the stock by id
  const getResp = await fetch(`${BASE}/stock/${stockId}`, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
    const getJson = await getResp.json();
    console.log('GET stock response status', getResp.status);
    console.log('GET stock:', JSON.stringify(getJson, null, 2));

    // Query suppliers collection for the supplierName used in the test
    const suppliersResp = await fetch(`${BASE}/suppliers?search=${encodeURIComponent('Test Supplier Inc')}`, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
    const suppliersJson = await suppliersResp.json();
    console.log('Suppliers query status', suppliersResp.status);
    console.log('Suppliers query body:', JSON.stringify(suppliersJson, null, 2));

    console.log('Test completed');
    process.exit(0);
  }catch(err){
    console.error('Test script error:', err);
    process.exit(2);
  }
}

main();
