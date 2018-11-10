import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';

const Identify = () => (
  <div>
    <header className="header">
      <p>Mimic Speech</p>
    </header>
    <input placeholder="Speech ID" />
    <br />
    <textarea placeholder="Random Indonesia words!" rows="4" cols="50" disabled />
    <button type="submit">Record</button>
    <br />
    <button type="submit">Identify Speech</button>
    <br />
    <Link to="/"><button type="submit">Finish</button></Link>
  </div>
);

export default Identify;
