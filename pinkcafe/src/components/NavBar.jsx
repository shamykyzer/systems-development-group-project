import React, { useState } from 'react';

function NavBar(){
    return(
        <nav className="bg-pinkcafe2 p-4 sticky top-0">
            <ul className="flex space-x-4 justify-center">
                <li> <a href="/" className="text-white font-bold">Home</a> </li>
                <li> <a href="/login" className="text-white font-bold">Login</a> </li>
            </ul>
        </nav>
    );

}

export default NavBar;