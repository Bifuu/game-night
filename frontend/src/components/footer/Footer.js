import React from 'react';
import styled from 'styled-components';

const Foot = styled.div`
  background-color: green;
  height: 25px;
`;

export const Footer = () => {
  return <Foot className="footer">footer</Foot>;
};
