import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import CelebrityCard from '../components/CelebrityCard';


const CelebrityTracker = () => {
  const CELEBRITIES = [
    { name: 'Warren Buffett', cik: '0001067983', img: 'image/celebrity/buffet.png', desc: 'Berkshire Hathaway 회장' },
    { name: 'Bill Gates', cik: '0001166559', img: 'image/celebrity/gates.png', desc: 'Microsoft 회장' },
    { name: 'Stanley Druckenmiller', cik: '0001536411', img: 'image/celebrity/druckenmiller.png', desc: 'Pfizer 회장' }
    // { name: 'Catherine Duddy Wood', cik: ''}
  ];

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        유명인 13F 따라잡기
      </Typography>
      <Grid container spacing={2}>
        {CELEBRITIES.map((c) => (
          <Grid item xs={12} sm={6} md={4} key={c.cik}>
            <CelebrityCard {...c} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CelebrityTracker;