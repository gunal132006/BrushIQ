const app = require('./app');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost';
}

console.log("SERVER STARTING");
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log("SERVER LISTENING ON PORT", PORT);
  const localIp = getLocalIpAddress();
  console.log(`=============================================`);
  console.log(`   BrushIQ REST API Service Booted Successful`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIp}:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=============================================`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing server gracefully.');
  server.close(() => {
    console.log('Http server closed.');
    process.exit(0);
  });
});
