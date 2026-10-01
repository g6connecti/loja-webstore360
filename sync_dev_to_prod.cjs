const { Pool } = require('pg');

async function syncDatabases() {
  const devPool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'cloud_sql_development_database',
  });

  const prodPool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'cloud_sql_production_database',
  });

  try {
    console.log('--- SYNCING DEV TO PRODUCTION DATABASE ---');

    // 1. Sync produtos_ofertas
    console.log('Fetching dev produtos_ofertas...');
    const devOffers = await devPool.query('SELECT * FROM produtos_ofertas ORDER BY created_at ASC;');
    console.log(`Found ${devOffers.rows.length} offers in DEV.`);

    console.log('Clearing old offers in PROD...');
    await prodPool.query('DELETE FROM produtos_ofertas;');

    console.log('Inserting all offers into PROD...');
    for (const row of devOffers.rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.map(k => `"${k}"`).join(', ');

      const query = `INSERT INTO produtos_ofertas (${columns}) VALUES (${placeholders});`;
      await prodPool.query(query, values);
    }

    const prodOffersCount = await prodPool.query('SELECT COUNT(*) as count FROM produtos_ofertas;');
    console.log(`PROD now has ${prodOffersCount.rows[0].count} offers!`);

    // Verify Mercado Livre specifically in PROD
    const prodML = await prodPool.query("SELECT platform, count(*) FROM produtos_ofertas GROUP BY platform;");
    console.log('PROD offers by platform:', prodML.rows);

    // 2. Sync plataformas_credenciais
    console.log('Fetching dev plataformas_credenciais...');
    const devPlatforms = await devPool.query('SELECT * FROM plataformas_credenciais;');
    console.log(`Found ${devPlatforms.rows.length} platforms in DEV.`);

    for (const row of devPlatforms.rows) {
      const { platform_name, display_name, affiliate_partner_id, app_id, app_secret, api_key, access_token, refresh_token, webhook_secret, is_active, sync_frequency_minutes, last_synced_at } = row;

      await prodPool.query(`
        INSERT INTO plataformas_credenciais (
          platform_name, display_name, affiliate_partner_id, app_id, app_secret, api_key, access_token, refresh_token, webhook_secret, is_active, sync_frequency_minutes, last_synced_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) ON CONFLICT (platform_name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          affiliate_partner_id = EXCLUDED.affiliate_partner_id,
          app_id = EXCLUDED.app_id,
          app_secret = EXCLUDED.app_secret,
          api_key = EXCLUDED.api_key,
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          webhook_secret = EXCLUDED.webhook_secret,
          is_active = EXCLUDED.is_active,
          sync_frequency_minutes = EXCLUDED.sync_frequency_minutes,
          last_synced_at = EXCLUDED.last_synced_at,
          updated_at = NOW();
      `, [platform_name, display_name, affiliate_partner_id, app_id, app_secret, api_key, access_token, refresh_token, webhook_secret, is_active, sync_frequency_minutes, last_synced_at]);
    }
    console.log('Platforms credentials synced to PROD successfully.');

    console.log('SUCCESS: DEV and PROD databases are now 100% synchronized!');
  } catch (err) {
    console.error('SYNC ERROR:', err);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

syncDatabases();
