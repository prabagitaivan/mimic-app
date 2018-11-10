import React from 'react';
import { Link } from 'react-router-dom';
import logo from './logo.svg';
import './index.css';

const Home = () => (
  <div>
    <header className="header">
      <img src={logo} className="logo" alt="logo" />
      <p>Mimic Speech</p>
    </header>
    <Link to="/identify"><button type="submit">Identify Speech</button></Link>
    <Link to="/generate"><button type="submit">Generate Speech</button></Link>
  </div>
);

export default Home;
