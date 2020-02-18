import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ChatBox = styled.div`
  border: 1px solid black;
  display: flex;
  flex-direction: column;
`;

const Log = styled.ul`
  list-style-type: none;
  flex: 1 1 auto;
  overflow-y: auto;
  height: 0px;
  padding-left: 5px;
  justify-self: flex-end;
`;

export const Chat = ({ user }) => {
  console.log(`Chat Drawn`);

  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    let chatLogElem = document.getElementById('chatlog');
    chatLogElem.scrollTop = chatLogElem.scrollHeight;
  }, [chatLog]);

  useEffect(() => {
    if (user.socket) {
      console.log(`Setting up Chat`);

      user.socket.on('player joined', data => {
        setPlayers(data.players);
        setChatLog(c =>
          c.concat({
            username: 'SYSTEM',
            message: `${data.username} has joined the game.`,
          })
        );
      });

      user.socket.on('loggedin', data => {
        setPlayers(data.players);
      });

      user.socket.on('new message', data => setChatLog(c => c.concat(data)));
    }
  }, [user.socket]);

  const sendMessage = () => {
    if (message === '') return;

    setChatLog(chatLog.concat({ username: user.name, message }));
    user.socket.emit('chat message', message);
    setMessage('');
  };

  return (
    <ChatBox>
      <div className="chat_header">
        Room {user.room}, #{players.length} {user.leader ? ': 👑' : ''}
      </div>
      <Log id="chatlog">
        {chatLog.map(({ username, message }, index) => {
          return <li key={index}>{`${username}: ${message}`}</li>;
        })}
      </Log>

      <div className="chat_footer">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={({ key }) => {
            if (key === 'Enter') sendMessage();
          }}
        />
        <button onClick={() => sendMessage()}>Send</button>
      </div>
    </ChatBox>
  );
};
