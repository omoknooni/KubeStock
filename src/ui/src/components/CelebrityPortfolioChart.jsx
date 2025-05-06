import React from 'react';
import { Box } from '@mui/material';
import { ResponsivePie } from '@nivo/pie';

const CelebrityPortfolioChart = ({data}) => {  
    return (
        <Box height={250}>
          <ResponsivePie
            data={data}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={false}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            colors={(d) => d.data.color}
            animate={false}
          />
        </Box>
      );
};

export default CelebrityPortfolioChart;