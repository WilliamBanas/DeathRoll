import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import { SocketProvider } from './contexts/socket';

const App: React.FC = () => {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:lobbyId" element={<Lobby />} />
      </Routes>
    </SocketProvider>
  );
};

export default App;
