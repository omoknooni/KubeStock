import React from 'react';
import { Box, Typography } from '@mui/material';
import { ResponsivePie } from '@nivo/pie';

const CelebrityPortfolioChart = ({data}) => {  
    return (
        <Box sx={{ width: "100%", flex: 1, height: 300}}>
          <ResponsivePie
            data={data}
            margin={{ top: 40, right: 40, bottom: 80, left: 40 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLabels={false}
            enableArcLinkLabels={true}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabel="label"
            arcLinkLabelsTextColor="#333"
            arcLinkLabelsThickness={2}
            arcLabelsSkipAngle={10}
            colors={(d) => d.data.color}
            tooltip={({ datum }) => (
              <Typography sx={{ p: 1 }}>
                {datum.id}: {Number(datum.value).toLocaleString()} ({datum.formattedValue})
              </Typography>
            )}
          />
        </Box>
      );
};

export default CelebrityPortfolioChart;