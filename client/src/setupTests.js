// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// React Router 7 uses the browser Encoding API; JSDOM's older runtime omits it.
const {TextEncoder, TextDecoder} = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
