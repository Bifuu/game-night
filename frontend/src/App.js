import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import styled from 'styled-components';
import { BrowserRouter as Router } from 'react-router-dom';

import './App.css';
import { Footer } from './components/footer/Footer';
import { Header } from './components/header/Header';
import { Room } from './components/room/Room';
import { JoinRoom } from './components/join-room/JoinRoom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Hallway = styled.div`
  background-color: grey;
  flex: auto;
  display: flex;
`;

function App() {
  const [user, setUser] = useState({
    name: null,
    socket: null,
    leader: false,
    room: null,
  });

  useEffect(() => {
    if (user.name && !user.socket) {
      const socket = socketIOClient('localhost:4001');
      console.group('Connection starting');
      console.log('username: ', user.name);
      console.log('room', user.room);
      console.groupEnd();
      socket.emit('login', { username: user.name, room: user.room });
      setUser({ ...user, socket });
    }
  }, [user]);

  const setUserName = (name, room = null) => {
    setUser({ ...user, name, room });
  };

  const showRoom = () => {
    if (!user.socket) {
      return (
        <JoinRoom
          setUser={(n, r) => {
            setUserName(n, r);
          }}
        />
      );
    } else {
      return <Room user={user} setUser={setUser} />;
    }
  };

  return (
    <Router>
      <Container>
        <Header />
        <Hallway>{showRoom()}</Hallway>
        <Footer />
      </Container>
    </Router>
  );
}

export default App;
