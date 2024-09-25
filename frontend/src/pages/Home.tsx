import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = () => {
    fetch(`${API_URL}/auth/check`, {
      method: "GET",
      credentials: "include",
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      setIsAuthenticated(data.authenticated);
    })
    .catch(() => {
      setIsAuthenticated(false);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const API_URL = "http://localhost:3000";

  useEffect(() => {
    checkAuth();
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login'); // Redirige vers la page d'accueil si l'utilisateur est authentifié
    }
  }, [loading, isAuthenticated, navigate]);

  const logout = () => {
    fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // Inclure les cookies
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      // Optionnel : rediriger vers la page de login après déconnexion
      navigate('/login'); 
    })
    .catch(error => {
      console.error('Error while logging out:', error);
    });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Hello world !</h1>
      <button onClick={logout} >Logout</button>
    </div>
  )
}

export default Home;
