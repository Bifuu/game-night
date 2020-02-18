import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import socketIOClient from 'socket.io-client';

import OlgPlayerHand from '../olg/OlgPlayerHand';
import OlgCard from '../olg/OlgCard';

const PlayArea = styled.div`
  flex: auto;
`;

export const OneLeft = ({ user, players }) => {
  const [gameSocket, setGameSocket] = useState(null);
  const [game, setGame] = useState(false);
  const [whosTurn, setWhosTurn] = useState('someone');
  const [myTurn, setMyTurn] = useState(false);
  const [hand, setHand] = useState([]);
  const [inPlay, setInPlay] = useState({});
  const [wildChoice, setWildChoice] = useState(false);
  const [wildColor, setWildColor] = useState(null);

  useEffect(() => {
    if (user.socket && gameSocket === null) {
      console.log('Set up game socket');
      const gsock = socketIOClient('localhost:4001/oneleftgame');

      setGameSocket(gsock);
    }
  }, [user, gameSocket]);

  useEffect(() => {
    if (gameSocket) {
      console.log('Register game events');

      gameSocket.on('game start', ({ inPlay, hands }) => {
        console.log('game start');
        setInPlay(inPlay);
        setGame(true);
      });

      gameSocket.on('turn starting', username => {
        setWhosTurn(username);
      });

      gameSocket.on('starting hand', startingHand => {
        setHand(startingHand.hand);
      });

      gameSocket.on('game end', data => {
        setGame(false);
      });

      gameSocket.on('turn start', data => {
        setMyTurn(true);
      });

      gameSocket.on('turn end', data => {});

      gameSocket.on('drawn card', cardDrawn => {
        setHand(h => h.concat(cardDrawn));
      });

      gameSocket.on('card played', card => {
        setInPlay(card);
      });

      gameSocket.on('remove card from hand', card => {
        setHand(h => h.filter(c => c.id !== card.id));
      });

      gameSocket.on('wild choice', () => {
        setWildChoice(true);
      });

      gameSocket.on('wild color chosen', color => {
        setWildColor(color);
      });

      gameSocket.emit('player ready', user.name);
    }
  }, [gameSocket, user.name]);

  const wildChooseColor = color => {
    gameSocket.emit('wild color choice', color);
    setWildChoice(false);
    setWildColor(color);
  };

  const wildChoiceUI = () => {
    if (wildChoice)
      return (
        <span>
          <button onClick={() => wildChooseColor('red')}>Red</button>
          <button onClick={() => wildChooseColor('green')}>Green</button>
          <button onClick={() => wildChooseColor('blue')}>Blue</button>
          <button onClick={() => wildChooseColor('yellow')}>Yellow</button>
        </span>
      );
  };

  const ReadyScreen = () => {
    if (!user.leader) return <div>Waiting for the leader...</div>;

    return (
      <div>
        <button
          onClick={() => {
            gameSocket.emit('oneLeft start');
            setGame(true);
          }}
        >
          Start Game
        </button>
      </div>
    );
  };

  const PlayGame = () => {
    return (
      <>
        <h2>Its {whosTurn}'s Turn!</h2>
        <div>
          <button
            onClick={() => {
              console.log('Draw card');
              gameSocket.emit('test draw', players);
            }}
            disabled={!myTurn}
          >
            Draw card
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              setMyTurn(false);
              gameSocket.emit('end turn');
            }}
            disabled={!myTurn}
          >
            End Turn
          </button>
          <button
            onClick={() => {
              gameSocket.emit('test skip');
            }}
            disabled={!myTurn}
          >
            Skip
          </button>
          <button
            onClick={() => {
              gameSocket.emit('test reverse');
            }}
            disabled={!myTurn}
          >
            reverse
          </button>
          <button
            onClick={() => {
              gameSocket.uemit('test draw2');
            }}
            disabled={!myTurn}
          >
            Draw 2
          </button>
        </div>
        <div>
          <OlgCard card={inPlay} />
          {wildColor}
          {wildChoiceUI()}
          <OlgPlayerHand
            hand={hand}
            click={c => {
              if (!myTurn) return;
              console.log('clicked', c);
              if (
                c.color === inPlay.color ||
                c.value === inPlay.value ||
                c.color === 'wild' ||
                (wildColor !== null && c.color === wildColor)
              ) {
                console.log('WE can play this card!');
                gameSocket.emit('play card', c);
              }
            }}
          />
        </div>
      </>
    );
  };

  return <PlayArea>{game ? PlayGame() : ReadyScreen()}</PlayArea>;
};
