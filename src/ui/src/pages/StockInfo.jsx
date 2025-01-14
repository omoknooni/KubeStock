import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Grid, Paper } from "@mui/material";
import { useParams } from "react-router-dom";

import config from "../config/apiConfig";

const Equity = ({data}) => {
    return (
        <Box mt={4}>
            <Typography variant="h6" gutterBottom>
                Business Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.business_summary}
            </Typography>

            <Typography variant="h6">
                Industry
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.industry}
            </Typography>

            <Typography variant="h6">
                Sector
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.sector}
            </Typography>

            <Typography variant="h6">
                PER
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.per}
            </Typography>

            <Typography variant="h6">
                PBR
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.pbr}
            </Typography>

            <Typography variant="h6">
                ROE
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.roe}
            </Typography>

            <Typography variant="h6">
                ROA
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.roa}
            </Typography>
        </Box>
    );
};

const Etf = ({ data }) => {
    if (!data) {
        return <div>no data...</div>;
    }
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Full Name
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {data.short_name}
            </Typography>
            <Typography variant="h6" gutterBottom>
                Business Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {data.business_summary}
            </Typography>

            <Typography variant="h6" gutterBottom>
                Fund Family
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {data.fund_family}
            </Typography>
            <Typography variant="h6" gutterBottom>
                NAV
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {data.nav}
            </Typography>
        </Box>
    );
};

const RenderComponent = ({quoteType, data}) => {
    switch (quoteType) {
        case 'EQUITY':
            return <Equity data={data} />;
        case 'ETF':
            return <Etf data={data} />;
        default:
            return <div>Loading...</div>;
    }
};

const StockInfo = () => {
  const { stockSymbol } = useParams();
  const [stockInfoData, setStockInfoData] = useState({});

  useEffect(() => {
    const fetchStockInfoData = async () => {
      try {
        const response = await fetch(`http://${config.stocksApiUrl}/stocks/${stockSymbol}/info`);
        const data = await response.json();
        setStockInfoData(data);
      } catch (error) {
        console.error("Error fetching stock data:", error);
      }
    };

    fetchStockInfoData();
  }, [stockSymbol]);

  if (!stockInfoData) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
        {stockInfoData.symbol}
        </Typography>
        <Typography variant="h6" gutterBottom fontStyle={{ color: 'gray' }}>
            {stockInfoData.short_name}
        </Typography>

        
        {/* Additional Info */}
        <RenderComponent quoteType={stockInfoData.quote_type} data={stockInfoData} />
      </Box>
    </Container>
  );
};

export default StockInfo;