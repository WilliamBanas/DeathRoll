import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import { SocketProvider } from './contexts/socket';

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:lobbyId" element={<Lobby />} />
        <Route path='/test' element='<h1>Test</h1>' />
      </Routes>
    </SocketProvider>
  )
}

export default App;
