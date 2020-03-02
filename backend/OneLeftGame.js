/*
  One left Game
  Game mode for 'game-night'

  Clone of classic game 'Uno'
  Dustin Stover 2/13/2020
*/
const OneLeftDeck = require('./OlgDeck');

class OneLeftGame {
  constructor(io, playerData) {
    this.io = io;
    this.gameRoom = playerData.room;
    this.playerMap = new Map();
    this.players = [];
    this.currentTurn = 0;
    this.unoDeck = [];
    this.handSize = 7;
    this.inPlay = [];
    this.reversed = false;
    this.wildColor = null;

    this.io.of('/oneleftgame').on('connection', socket => {
      console.log('Player connected to OLG', socket.id);
      socket.join(this.gameRoom);

      socket.on('player ready', username => {
        socket.username = username;
        this.players.push({ username });
        this.playerMap.set(username, socket);
      });

      socket.on('oneLeft start', () => {
        this.startOneLeft(this.players);
      });

      socket.on('end turn', () => {
        this.endTurn();
      });

      socket.on('play card', card => {
        if (socket.username !== this.CurrentPlayer.username) return;
        console.log('trying to play ', card);
        if (this.CurrentPlayer.hand.filter(c => c.id === card.id) === 0) return;
        if (
          card.color === this.inPlay[0].color ||
          card.value === this.inPlay[0].value ||
          card.color === 'wild' ||
          (this.wildColor !== null && card.color === this.wildColor)
        ) {
          const newHand = this.CurrentPlayer.hand.filter(c => c.id !== card.id);
          this.CurrentPlayer.hand = newHand;
          this.playCard(card);
          socket.emit('remove card from hand', card);
          let skipValue = 0;
          if (card.value === 'S') {
            skipValue = 1;
          }
          if (card.value === 'R') {
            this.reversed = !this.reversed;
          }
          if (card.value === 'D2') {
            const cardsToDraw = this.unoDeck.splice(0, 2);
            this.getNextPlayer().hand.concat(cardsToDraw);
            this.playerMap
              .get(this.getNextPlayer().username)
              .emit('drawn card', cardsToDraw);
            skipValue = 1;
          }
          if (card.color === 'wild') {
            this.playerMap.get(this.CurrentPlayer.username).emit('wild choice');
            return;
          }
          this.endTurn(skipValue);
        }
      });

      socket.on('wild color choice', color => {
        this.wildColor = color;
        console.log(`wild color is ${color}`);
        io.of('/oneleftgame').emit('wild color chosen', color);
        this.endTurn();
      });

      socket.on('draw card', () => {});
      socket.on('test draw', () => {
        if (socket.username !== this.CurrentPlayer.username) return;

        const drawnCard = this.unoDeck.shift();
        this.CurrentPlayer.hand.push(drawnCard);
        this.playerMap
          .get(this.CurrentPlayer.username)
          .emit('drawn card', drawnCard);
      });

      socket.on('test skip', () => {
        if (socket.username !== this.CurrentPlayer.username) return;
        this.endTurn(1);
      });
      socket.on('test reverse', () => {
        if (socket.username !== this.CurrentPlayer.username) return;

        this.reversed = !this.reversed;
        this.endTurn();
      });
      socket.on('test draw2', () => {
        if (socket.username !== this.CurrentPlayer.username) return;

        console.log(`draw 2`);

        const cardsToDraw = this.unoDeck.splice(0, 2);
        this.getNextPlayer().hand.concat(cardsToDraw);
        this.playerMap
          .get(this.getNextPlayer().username)
          .emit('drawn card', cardsToDraw);
        this.endTurn(1);
      });
    });
  }

  get CurrentPlayer() {
    return this.players[this.currentTurn];
  }

  shuffleDeck = deck => {
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

  startTurnFor = username => {
    this.currentTurn = this.players.findIndex(p => p.username === username);
    this.playerMap.get(username).emit('turn start');
    this.io
      .of('/oneleftgame')
      .to(this.gameRoom)
      .emit('turn starting', username);
  };

  DealCards = () => {
    // Deal cards from deck
    this.players = this.players.map(player => {
      const p = {
        ...player,
        hand: this.unoDeck.splice(0, this.handSize),
      };
      this.playerMap
        .get(p.username)
        .emit('starting hand', { username: p.username, hand: p.hand });

      return p;
    });
    // Draw first card

    while (this.inPlay.length === 0 || this.inPlay.color === 'wild') {
      this.inPlay.push(this.unoDeck.shift());
    }
    // This sends to EVERYONE, we need to set up a "game room"
    this.io
      .of('/oneleftgame')
      .to(this.gameRoom)
      .emit('game start', {
        inPlay: this.inPlay[0],
        hands: this.players.map(p => ({
          player: p.username,
          hand: p.hand.length,
        })),
      });

    this.startTurnFor(this.players[0].username);
    console.log('in play', this.inPlay);
  };

  startOneLeft = gamePlayers => {
    // Grab a copy of the uno deck and shuffle it.
    this.unoDeck = this.shuffleDeck(OneLeftDeck.slice());

    // Setup player object structure
    this.players = gamePlayers.map(player => ({
      username: player.username,
      hand: [],
    }));

    // Reset other game vars
    this.inPlay = [];

    this.DealCards();
  };

  getNextPlayer = (skipAmount = 0) => {
    let dir = 1;
    if (this.reversed) dir *= -1;

    let nextPlayer = this.currentTurn + dir + dir * skipAmount;

    let newIndex = nextPlayer % this.players.length;
    if (newIndex <= -1) newIndex = this.players.length + newIndex;
    nextPlayer = newIndex;

    return this.players[nextPlayer];
  };

  endTurn = (skipAmount = 0) => {
    this.startTurnFor(this.getNextPlayer(skipAmount).username);
  };

  playCard = card => {
    this.inPlay.unshift(card);
    this.io
      .of('/oneleftgame')
      .to(this.gameRoom)
      .emit('card played', card);
    if (this.wildColor !== null && card.color !== 'wild')
      this.io.emit('wild color chosen', null);
  };
}

// const game = (io, playerData) => {
//   console.log(`====OLG game starting for ${playerData.room}====`);
//   console.log(playerData);
//   const gameRoom = playerData.room;
//   const playerMap = new Map();
//   let players = [];
//   let currentTurn = 0;
//   const getCurrentPlayer = () => players[currentTurn];

//   let unoDeck = [];
//   const handSize = 7;
//   let inPlay = [];
//   let reversed = false;
//   let wildColor = null;

//   // Uno Functions
//   const shuffleDeck = deck => {
//     let currentIndex = deck.length;
//     let temporaryValue;
//     let randomIndex;

//     // While there remain elements to shuffle...
//     while (currentIndex !== 0) {
//       // Pick a remaining element...
//       randomIndex = Math.floor(Math.random() * currentIndex);
//       currentIndex -= 1;

//       // And swap it with the current element.
//       temporaryValue = deck[currentIndex];
//       deck[currentIndex] = deck[randomIndex];
//       deck[randomIndex] = temporaryValue;
//     }

//     return deck;
//   };

//   const startTurnFor = username => {
//     currentTurn = players.findIndex(p => p.username === username);
//     playerMap.get(username).emit('turn start');
//     io.of('/oneleftgame')
//       .to(gameRoom)
//       .emit('turn starting', username);
//   };

//   const DealCards = () => {
//     // Deal cards from deck
//     players = players.map(player => {
//       const p = {
//         ...player,
//         hand: unoDeck.splice(0, handSize),
//       };
//       playerMap
//         .get(p.username)
//         .emit('starting hand', { username: p.username, hand: p.hand });

//       return p;
//     });
//     // Draw first card

//     while (inPlay.length === 0 || inPlay.color === 'wild') {
//       inPlay.push(unoDeck.shift());
//     }
//     // This sends to EVERYONE, we need to set up a "game room"
//     io.of('/oneleftgame')
//       .to(gameRoom)
//       .emit('game start', {
//         inPlay: inPlay[0],
//         hands: players.map(p => ({
//           player: p.username,
//           hand: p.hand.length,
//         })),
//       });

//     startTurnFor(players[0].username);
//     console.log('in play', inPlay);
//   };

//   const startOneLeft = gamePlayers => {
//     // Grab a copy of the uno deck and shuffle it.
//     unoDeck = shuffleDeck(OneLeftDeck.slice());

//     // Setup player object structure
//     players = gamePlayers.map(player => ({
//       username: player.username,
//       hand: [],
//     }));

//     // Reset other game vars
//     inPlay = [];

//     DealCards();
//   };

//   const getNextPlayer = (skipAmount = 0) => {
//     let dir = 1;
//     if (reversed) dir *= -1;

//     let nextPlayer = currentTurn + dir + dir * skipAmount;

//     let newIndex = nextPlayer % players.length;
//     if (newIndex <= -1) newIndex = players.length + newIndex;
//     nextPlayer = newIndex;

//     return players[nextPlayer];
//   };

//   const endTurn = (skipAmount = 0) => {
//     startTurnFor(getNextPlayer(skipAmount).username);
//   };

//   const playCard = card => {
//     inPlay.unshift(card);
//     io.of('/oneleftgame')
//       .to(gameRoom)
//       .emit('card played', card);
//     if (wildColor !== null && card.color !== 'wild')
//       io.emit('wild color chosen', null);
//   };

//   io.of('/oneleftgame').on('connection', socket => {
//     console.log('Player connected to OLG', socket.id);
//     socket.join(gameRoom);

//     socket.on('player ready', username => {
//       socket.username = username;
//       players.push({ username });
//       playerMap.set(username, socket);
//     });

//     socket.on('oneLeft start', () => {
//       startOneLeft(players);
//     });

//     socket.on('end turn', () => {
//       endTurn();
//     });

//     socket.on('play card', card => {
//       if (socket.username !== getCurrentPlayer().username) return;
//       console.log('trying to play ', card);
//       if (getCurrentPlayer().hand.filter(c => c.id === card.id) === 0) return;
//       if (
//         card.color === inPlay[0].color ||
//         card.value === inPlay[0].value ||
//         card.color === 'wild' ||
//         (wildColor !== null && card.color === wildColor)
//       ) {
//         const newHand = getCurrentPlayer().hand.filter(c => c.id !== card.id);
//         getCurrentPlayer().hand = newHand;
//         playCard(card);
//         socket.emit('remove card from hand', card);
//         let skipValue = 0;
//         if (card.value === 'S') {
//           skipValue = 1;
//         }
//         if (card.value === 'R') {
//           reversed = !reversed;
//         }
//         if (card.value === 'D2') {
//           const cardsToDraw = unoDeck.splice(0, 2);
//           getNextPlayer().hand.concat(cardsToDraw);
//           playerMap
//             .get(getNextPlayer().username)
//             .emit('drawn card', cardsToDraw);
//           skipValue = 1;
//         }
//         if (card.color === 'wild') {
//           playerMap.get(getCurrentPlayer().username).emit('wild choice');
//           return;
//         }
//         endTurn(skipValue);
//       }
//     });

//     socket.on('wild color choice', color => {
//       wildColor = color;
//       console.log(`wild color is ${color}`);
//       io.of('/oneleftgame').emit('wild color chosen', color);
//       endTurn();
//     });

//     socket.on('draw card', () => {});
//     socket.on('test draw', () => {
//       if (socket.username !== getCurrentPlayer().username) return;

//       const drawnCard = unoDeck.shift();
//       getCurrentPlayer().hand.push(drawnCard);
//       playerMap.get(getCurrentPlayer().username).emit('drawn card', drawnCard);
//     });

//     socket.on('test skip', () => {
//       if (socket.username !== getCurrentPlayer().username) return;
//       endTurn(1);
//     });
//     socket.on('test reverse', () => {
//       if (socket.username !== getCurrentPlayer().username) return;

//       reversed = !reversed;
//       endTurn();
//     });
//     socket.on('test draw2', () => {
//       if (socket.username !== getCurrentPlayer().username) return;

//       console.log(`draw 2`);

//       const cardsToDraw = unoDeck.splice(0, 2);
//       getNextPlayer().hand.concat(cardsToDraw);
//       playerMap.get(getNextPlayer().username).emit('drawn card', cardsToDraw);
//       endTurn(1);
//     });
//   });

//   // startOneLeft(playerMap);
// };

module.exports = OneLeftGame;
