import React from 'react';
import { Dice1 as Dice } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <Dice className="h-6 w-6 text-yellow-400 mr-2" />
            <span className="text-xl font-bold text-white">AVM Satoshi Dice</span>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">
              Games
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Create Game
            </a>
            <a href="#" className="hover:text-white transition-colors">
              My Games
            </a>
            <a href="#" className="hover:text-white transition-colors">
              About
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} AVM Satoshi Dice. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;