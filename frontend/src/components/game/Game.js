import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { OneLeft } from '../OneLeft/OneLeft';

const PlayArea = styled.div`
  flex: auto;
`;

export const Game = ({ user, players }) => {
  const [game, setGame] = useState(false);

  useEffect(() => {
    if (user.socket) {
      user.socket.on('starting olg', () => {
        setGame(true);
      });
    }
  }, [user.socket]);

  const ChooseGame = () => {
    if (user.leader) {
      return (
        <>
          <div>Choose Game:</div>
          <div>
            <button
              onClick={() => {
                user.socket.emit('olg start', {
                  room: user.room,
                  gamePlayers: players,
                  game: 'olg',
                });
                setGame(true);
              }}
            >
              OLG
            </button>
            <button>Draw</button>
          </div>
        </>
      );
    } else {
      return <div>The Leader is picking a game.</div>;
    }
  };

  const PlayGame = () => {
    return <OneLeft user={user} players={players} />;
  };

  return (
    <PlayArea>
      {user.leader ? <button>End game</button> : null}{' '}
      {!game ? ChooseGame() : PlayGame()}
    </PlayArea>
  );
};
