/*
  One left Game
  Game mode for 'game-night'

  Clone of classic game 'Uno'
  Dustin Stover 2/13/2020
*/
const OneLeftDeck = require('./OlgDeck');

const game = (io, playerData) => {
  console.log('====OLG game====');
  console.log(playerData);
  const gameRoom = playerData.room;
  const playerMap = new Map();
  let players = [];
  let currentTurn = 0;
  const getCurrentPlayer = () => players[currentTurn];

  let unoDeck = [];
  const handSize = 7;
  let inPlay = [];
  let reversed = false;
  let wildColor = null;

  // Uno Functions
  const shuffleDeck = deck => {
    let currentIndex = deck.length;
    let temporaryValue;
    let randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = deck[currentIndex];
      deck[currentIndex] = deck[randomIndex];
      deck[randomIndex] = temporaryValue;
    }

    return deck;
  };

  const startTurnFor = username => {
    currentTurn = players.findIndex(p => p.username === username);
    console.log(`Starting turn for ${username}, index: ${currentTurn}`);
    playerMap.get(username).emit('turn start');
    io.of('/oneleftgame')
      .to(gameRoom)
      .emit('turn starting', username);
  };

  const DealCards = () => {
    // Deal cards from deck
    console.log(playerMap);
    console.log(players);
    players = players.map(player => {
      const p = {
        ...player,
        hand: unoDeck.splice(0, handSize),
      };
      playerMap
        .get(p.username)
        .emit('starting hand', { username: p.username, hand: p.hand });

      return p;
    });
    // Draw first card

    while (inPlay.length === 0 || inPlay.color === 'wild') {
      inPlay.push(unoDeck.shift());
    }
    // This sends to EVERYONE, we need to set up a "game room"
    io.of('/oneleftgame')
      .to(gameRoom)
      .emit('game start', {
        inPlay: inPlay[0],
        hands: players.map(p => ({
          player: p.username,
          hand: p.hand.length,
        })),
      });

    startTurnFor(players[0].username);
    console.log('in play', inPlay);
  };

  const startOneLeft = gamePlayers => {
    console.log('Starting a game of One Left!');
    console.log(gamePlayers);

    // Grab a copy of the uno deck and shuffle it.
    unoDeck = shuffleDeck(OneLeftDeck.slice());

    // Setup player object structure
    players = gamePlayers.map(player => ({
      username: player.username,
      hand: [],
    }));

    // Reset other game vars
    inPlay = [];

    DealCards();
  };

  const getNextPlayer = (skipAmount = 0) => {
    let dir = 1;
    if (reversed) dir *= -1;

    let nextPlayer = currentTurn + dir + dir * skipAmount;

    let newIndex = nextPlayer % players.length;
    if (newIndex <= -1) newIndex = players.length + newIndex;
    nextPlayer = newIndex;

    return players[nextPlayer];
  };

  const endTurn = (skipAmount = 0) => {
    startTurnFor(getNextPlayer(skipAmount).username);
  };

  const playCard = card => {
    inPlay.unshift(card);
    io.of('/oneleftgame')
      .to(gameRoom)
      .emit('card played', card);
    if (wildColor !== null && card.color !== 'wild')
      io.emit('wild color chosen', null);
  };

  io.of('/oneleftgame').on('connection', socket => {
    console.log('Player connected to OLG', socket.id);
    socket.join(gameRoom);

    socket.on('player ready', username => {
      socket.username = username;
      players.push({ username });
      playerMap.set(username, socket);
    });

    socket.on('oneLeft start', () => {
      startOneLeft(players);
    });

    socket.on('end turn', () => {
      endTurn();
    });

    socket.on('play card', card => {
      if (socket.username !== getCurrentPlayer().username) return;
      console.log('trying to play ', card);
      if (getCurrentPlayer().hand.filter(c => c.id === card.id) === 0) return;
      if (
        card.color === inPlay[0].color ||
        card.value === inPlay[0].value ||
        card.color === 'wild' ||
        (wildColor !== null && card.color === wildColor)
      ) {
        const newHand = getCurrentPlayer().hand.filter(c => c.id !== card.id);
        getCurrentPlayer().hand = newHand;
        playCard(card);
        socket.emit('remove card from hand', card);
        let skipValue = 0;
        if (card.value === 'S') {
          skipValue = 1;
        }
        if (card.value === 'R') {
          reversed = !reversed;
        }
        if (card.value === 'D2') {
          const cardsToDraw = unoDeck.splice(0, 2);
          getNextPlayer().hand.concat(cardsToDraw);
          playerMap
            .get(getNextPlayer().username)
            .emit('drawn card', cardsToDraw);
          skipValue = 1;
        }
        if (card.color === 'wild') {
          playerMap.get(getCurrentPlayer().username).emit('wild choice');
          return;
        }
        endTurn(skipValue);
      }
    });

    socket.on('wild color choice', color => {
      wildColor = color;
      console.log(`wild color is ${color}`);
      io.of('/oneleftgame').emit('wild color chosen', color);
      endTurn();
    });

    socket.on('draw card', () => {});
    socket.on('test draw', () => {
      if (socket.username !== getCurrentPlayer().username) return;

      const drawnCard = unoDeck.shift();
      getCurrentPlayer().hand.push(drawnCard);
      playerMap.get(getCurrentPlayer().username).emit('drawn card', drawnCard);
    });

    socket.on('test skip', () => {
      if (socket.username !== getCurrentPlayer().username) return;
      endTurn(1);
    });
    socket.on('test reverse', () => {
      if (socket.username !== getCurrentPlayer().username) return;

      reversed = !reversed;
      endTurn();
    });
    socket.on('test draw2', () => {
      if (socket.username !== getCurrentPlayer().username) return;

      console.log(`draw 2`);

      const cardsToDraw = unoDeck.splice(0, 2);
      getNextPlayer().hand.concat(cardsToDraw);
      playerMap.get(getNextPlayer().username).emit('drawn card', cardsToDraw);
      endTurn(1);
    });
  });

  // startOneLeft(playerMap);
};

module.exports = game;
