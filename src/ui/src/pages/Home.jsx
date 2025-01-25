import React from 'react';
import MarketStatus from '../components/marketStatus';
import NewsList from '../components/NewsList';

const Layout = () => {
  document.title = 'KubeStock';
  return (
    <MarketStatus />
    // <NewsList />
  );
};

export default Layout;