const { httpServer } = require('./app');
const connectDB = require('./utils/db');

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`CodeOps AI server running on port ${PORT}`);
  });
}

start().catch(console.error);
