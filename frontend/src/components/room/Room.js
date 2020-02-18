import React, { useState, useEffect } from 'react';
import { Chat } from '../chat/Chat';
import { Game } from '../game/Game';

export const Room = ({ user, setUser }) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (user.socket) {
      user.socket.on('player joined', data => {
        setPlayers(data.players);
      });

      user.socket.on('loggedin', data => {
        setUser({ ...user, leader: data.leader });
      });
    }
    return () => {};
  }, [user, setUser]);

  return (
    <>
      <Game user={user} players={players} />
      <Chat user={user} />
    </>
  );
};
