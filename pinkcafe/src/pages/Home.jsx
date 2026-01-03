import React from 'react';
import NavBar from '../components/NavBar';
import LandingPagePanel from '../components/LandingPagePanel';


function Home() {
  return (
<div>
    <NavBar />
    <LandingPagePanel />
</div>
  );
}
// div here is essentially the background for the login page so if we want to change the color we can do it here not on the component
export default Home;