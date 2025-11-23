const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      universe_domain: "googleapis.com"
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

exports.handler = async (event, context) => {
  const projectId = event.queryStringParameters?.project;
  
  if (!projectId) {
    return {
      statusCode: 400,
      body: 'Project ID required'
    };
  }

  try {
    const db = admin.database();
    const snapshot = await db.ref(`running-servers/${projectId}`).once('value');
    const serverData = snapshot.val();

    if (!serverData || !serverData.files) {
      return {
        statusCode: 404,
        body: 'Server not found or not running'
      };
    }

    // Serve the HTML file
    const html = serverData.files['public/index.html'] || '<h1>No index.html found</h1>';
    const css = serverData.files['public/style.css'] || '';
    const js = serverData.files['public/client.js'] || '';

    // Inject CSS and JS into HTML
    const fullHTML = html
      .replace('</head>', `<style>${css}</style></head>`)
      .replace('</body>', `<script>${js}</script></body>`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      },
      body: fullHTML
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    };
  }
};
