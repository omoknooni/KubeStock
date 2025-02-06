import React from 'react';
import MarketStatus from '../components/MarketStatus';
import EmbeddedWidget from '../components/TrailingNews';
import EconomicCalender from '../components/EconomicCalender';
import Heatmap from '../components/Heatmap';
import { Box } from '@mui/material';

const Layout = () => {
  document.title = 'KubeStock';
  return (
    <Box sx={{ width: "95%", mx:"auto" }}>
      <MarketStatus />
      <EmbeddedWidget />
      <Box sx={{ display: "flex", marginBottom: 5, justifyContent: "space-between" }}>
        <EconomicCalender />
        <Heatmap />
      </Box>
    </Box>
  );
};

export default Layout;