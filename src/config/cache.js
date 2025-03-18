const NodeCache = require('node-cache');

// Cache with 5 minutes TTL
const cache = new NodeCache({ stdTTL: 300 });

module.exports = cache;