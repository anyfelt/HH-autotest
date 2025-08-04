const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use(cors());
app.use('/', createProxyMiddleware({ target: 'http://localhost:1234', changeOrigin: true }));
app.listen(5555, () => console.log('CORS Proxy на http://localhost:5555'));
