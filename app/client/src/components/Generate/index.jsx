import React from 'react';
import { Link } from 'react-router-dom';
import './index.css';

const Generate = () => (
  <div>
    <header className="header">
      <p>Mimic Speech</p>
    </header>
    <input list="speechid" />
    <datalist id="speechid">
      <option value="1" />
      <option value="2" />
      <option value="3" />
      <option value="4" />
    </datalist>
    <br />
    <textarea placeholder="Write some Indonesia words!" rows="4" cols="50" />
    <br />
    <button type="submit">Generate Speech</button>
    <br />
    <Link to="/"><button type="submit">Finish</button></Link>
  </div>
);

export default Generate;
