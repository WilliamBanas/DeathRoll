import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Room from './pages/Room';
import { SocketProvider } from './contexts/socket';

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/room/:roomId" element={<Room />} />

      </Routes>
    </SocketProvider>
     
  )
}

export default App
