import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import Home from './components/Home';
import Identify from './components/Identify';
import Generate from './components/Generate';

const Router = () => (
  <BrowserRouter>
    <div>
      <Route exact path="/" component={Home} />
      <Route path="/identify" component={Identify} />
      <Route path="/generate" component={Generate} />
    </div>
  </BrowserRouter>
);

export default Router;
