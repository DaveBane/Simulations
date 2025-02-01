import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Create a root element in the HTML
const rootElement = document.getElementById('root');

// Render the App component inside the root element
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  rootElement
);
