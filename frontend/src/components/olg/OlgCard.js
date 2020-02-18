import React from 'react';
import styled from 'styled-components';

const OlgCard = props => {
  //TODO: This component seems to cause some performance drops
  const Card = styled.div`
    height: 140px;
    width: 100px;
    border: 5px solid white;
    background: ${props.card.color === 'wild' ? '#17141d' : props.card.color};
    box-shadow: 0 0 10px #aaaaaa;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    display: flex;
    position: relative;
  `;

  const CardNum = styled.div`
    width: 100%;
    height: 75%;
    border-radius: 50%;
    background: white;
    align-items: center;
    justify-content: center;
    display: flex;
    position: relative;
    font-size: 70px;
  `;

  const cardClick = () => {
    if (props.click) return props.click(props.card);
  };

  return (
    <Card onClick={cardClick}>
      <CardNum>{props.card.value}</CardNum>
    </Card>
  );
};

export default OlgCard;
