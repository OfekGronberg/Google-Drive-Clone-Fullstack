const USERNAME_ALLOWED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._';
const PASSWORD_ALLOWED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.!@#$%^&*()-_+=';

function hasOnlyAllowedChars(value, allowedChars) {
  for (let i = 0; i < value.length; i += 1) {
    if (!allowedChars.includes(value[i])) {
      return false;
    }
  }
  return true;
}

export function validateUsername(username) {
  const errors = [];
  if (username.length < 8) {
    errors.push('username must be at least 8 characters long');
  }
  if (!hasOnlyAllowedChars(username, USERNAME_ALLOWED)) {
    errors.push('username can only contain English letters, numbers, periods, and underscores');
  }
  return errors;
}

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8 || password.length > 20) {
    errors.push('password must contain between 8 and 20 characters (inc.)');
  }
  if (!hasOnlyAllowedChars(password, PASSWORD_ALLOWED)) {
    errors.push('password can only contain English letters, numbers, and the symbols .!@#$%^&*()-_+=');
  }
  return errors;
}
