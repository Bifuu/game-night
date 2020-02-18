import React from 'react';
import styled from 'styled-components';

import OlgCard from './OlgCard';

const Hand = styled.div`
  display: flex;
`;

const OlgPlayerHand = ({ hand, click }) => {
  return (
    <div>
      <Hand>
        {hand.map((c, ci) => {
          return <OlgCard click={click} card={c} key={ci} />;
        })}
      </Hand>
    </div>
  );
};

export default OlgPlayerHand;
