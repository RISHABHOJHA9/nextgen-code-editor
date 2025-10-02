import React, { useContext } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import CollaborativeEditor from './components/CollaborativeEditor';
import Room from './components/Room';
import Login from './components/Login';
import Signup from './components/Signup';
import { AuthContext } from './context/AuthContext';
import './App.css';
import bannerImg from './assets/nextgen-banner.png';
import bgImg from './assets/sign.png';
import { ThemeProvider } from './context/ThemeContext';


const CollaborativeEditorWrapper = () => {
  const { roomId } = useParams();
  return <CollaborativeEditor roomId={roomId} />;
};

const App = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div
  className="app-container"
  style={{
    backgroundImage: `url(${bgImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }}
>

        <div className="auth-banner-container">
          <div>
            
            <div className="auth-section">
              <div className="auth-box"><Login /></div>
              <div className="auth-box"><Signup /></div>
            </div>
          </div>
          <img src={bannerImg} alt="NextGen" className="auth-banner" />
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
    <Routes>
      <Route path="/" element={<CodeEditor />} />
      <Route path="/room" element={<Room />} />
      <Route path="/editor/:roomId" element={<CollaborativeEditorWrapper />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </ThemeProvider>
  );
};

export default App;
