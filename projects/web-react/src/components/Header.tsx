import React from 'react';
import { Dice1 as Dice } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-4 px-6 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Dice className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold">AVM Satoshi Dice</h1>
            <p className="text-xs text-yellow-300">Blockchain-powered gaming</p>
          </div>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="hover:text-yellow-300 transition-colors">Games</a>
          <a href="#" className="hover:text-yellow-300 transition-colors">Create Game</a>
          <a href="#" className="hover:text-yellow-300 transition-colors">My Games</a>
          <a href="#" className="hover:text-yellow-300 transition-colors">About</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors">
            Connect Wallet
          </button>
          <button className="md:hidden text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;