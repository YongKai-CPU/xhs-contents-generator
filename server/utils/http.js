/**
 * HTTP Client Utility
 * Wrapper for axios with common configurations
 */

const axios = require('axios');
const config = require('../config/env');

/**
 * Create an axios instance with default config
 */
const httpClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'User-Agent': 'Xiaohongshu-Content-Generator/3.0',
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 */
httpClient.interceptors.request.use(
  (request) => {
    console.log('HTTP Request:', request.method.toUpperCase(), request.url);
    return request;
  },
  (error) => {
    console.error('HTTP Request Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 */
httpClient.interceptors.response.use(
  (response) => {
    console.log('HTTP Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('HTTP Response Error:', error.response.status, error.response.config.url);
    } else if (error.request) {
      console.error('HTTP No Response:', error.request);
    } else {
      console.error('HTTP Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * GET request helper
 */
async function get(url, options = {}) {
  const response = await httpClient.get(url, options);
  return response.data;
}

/**
 * POST request helper
 */
async function post(url, data, options = {}) {
  const response = await httpClient.post(url, data, options);
  return response.data;
}

/**
 * PUT request helper
 */
async function put(url, data, options = {}) {
  const response = await httpClient.put(url, data, options);
  return response.data;
}

/**
 * DELETE request helper
 */
async function del(url, options = {}) {
  const response = await httpClient.delete(url, options);
  return response.data;
}

module.exports = {
  httpClient,
  get,
  post,
  put,
  del
};
