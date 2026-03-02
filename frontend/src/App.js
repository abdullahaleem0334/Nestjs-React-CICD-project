import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="container">
        <h1>🚀 Project 1</h1>
        <h2>NestJS + React CI/CD Pipeline</h2>
        <p>Deployed via Jenkins on AWS EC2</p>
        <div className="status">
          <span>✅ Frontend: Running</span>
          <span>✅ Backend: Running</span>
          <span>✅ Pipeline: Active</span>
        </div>
        <p className="author">Developed by: Abdullah Aleem</p>
      </div>
    </div>
  );
}

export default App;
