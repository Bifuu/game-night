import React from 'react';
import styled from 'styled-components';

const Head = styled.div`
  background-color: red;
  height: 50px;
`;

export const Header = () => {
  return <Head className="header">header</Head>;
};
