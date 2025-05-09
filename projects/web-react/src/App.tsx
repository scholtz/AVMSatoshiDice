import React, { useState } from 'react';
import Header from './components/Header';
import GameList from './components/GameList';
import GameDetail from './components/GameDetail';
import Footer from './components/Footer';
import { useGames } from './hooks/useGames';

function App() {
  const { games, tokenFilter, setTokenFilter, getGameById, updateGame } = useGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const selectedGame = selectedGameId ? getGameById(selectedGameId) : undefined;
  
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    window.scrollTo(0, 0);
  };
  
  const handleBackToGames = () => {
    setSelectedGameId(null);
    window.scrollTo(0, 0);
  };
  
  // For demo purposes, assume the user is the owner of games with even IDs
  const isOwner = selectedGame ? parseInt(selectedGame.id) % 2 === 0 : false;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Header />
      
      <main className="min-h-[calc(100vh-64px-200px)]">
        {selectedGame ? (
          <GameDetail 
            game={selectedGame} 
            onBack={handleBackToGames} 
            onUpdateGame={updateGame}
            isOwner={isOwner}
          />
        ) : (
          <GameList 
            games={games} 
            tokenFilter={tokenFilter} 
            setTokenFilter={setTokenFilter}
            onSelectGame={handleSelectGame}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;