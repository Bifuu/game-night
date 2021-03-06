import React, { useState } from 'react';
import styled from 'styled-components';
// import { useHistory } from 'react-router-dom';

const Join = styled.div``;

export const JoinRoom = props => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');

  const setUser = (username, room) => {
    props.setUser(username, room);
  };

  return (
    <Join>
      <div>
        name:
        <input
          type="text"
          onChange={e => setName(e.target.value)}
          value={name}
        />
      </div>
      <div>
        room:
        <input
          type="text"
          onChange={e => setRoom(e.target.value)}
          value={room}
        />
      </div>

      <button onClick={e => setUser(name, room)}>Join</button>
    </Join>
  );
};
