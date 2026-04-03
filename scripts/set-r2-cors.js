/**
 * Set CORS configuration for R2 bucket using Cloudflare API
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

function getEnvVar(name) {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const ACCOUNT_ID = getEnvVar('CLOUDFLARE_ACCOUNT_ID');
const API_TOKEN = getEnvVar('CLOUDFLARE_API_TOKEN');
const BUCKET_NAME = getEnvVar('R2_BUCKET_NAME') || 'dubai-filmmaker-assets';

async function setCORS() {
  console.log('🔧 Setting CORS for R2 bucket:', BUCKET_NAME);
  console.log('');

  // Read CORS configuration
  const corsConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../r2-cors-config.json'), 'utf8')
  );

  console.log('📋 CORS Configuration:');
  console.log(JSON.stringify(corsConfig, null, 2));
  console.log('');

  // Set CORS using Cloudflare API
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corsConfig),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ CORS configuration applied successfully!');
      console.log('');
      console.log('🎉 Your R2 bucket now allows requests from:');
      corsConfig.rules[0].AllowedOrigins.forEach(origin => {
        console.log(`   - ${origin}`);
      });
      console.log('');
      console.log('💡 Tip: Clear your browser cache and refresh your website');
    } else {
      console.error('❌ Failed to set CORS:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
setCORS();
