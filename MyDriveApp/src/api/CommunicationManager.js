// Simple hardcoded token storage (instead of AsyncStorage)
let storedToken = 'dev-token';
let storedUserId = null;

// Simple request function
export function getBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
}

export async function request({ method, path, body }) {
  const baseUrl = getBaseUrl();
  const url = baseUrl + path;

  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add token to headers if available
  if (storedToken) {
    options.headers['Authorization'] = `Bearer ${storedToken}`;
  }

  // Add body if provided
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    const hasBody = text && text.trim().length > 0;
    const data = hasBody ? JSON.parse(text) : null;

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || 'Request failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw new Error('Network error: ' + error.message);
  }
}

// Simple function to set token (instead of AsyncStorage)
export function setToken(token) {
  storedToken = token;
}

// Simple function to set userId
export function setUserId(userId) {
  storedUserId = userId;
}

// Simple function to get token
export function getToken() {
  return storedToken;
}

// Simple function to get userId
export function getUserId() {
  return storedUserId;
}
