import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Grid, Paper } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import CandlestickChart from "../components/LightChart";
import config from "../config/apiConfig";

const Stocks = () => {
    const { stockSymbol } = useParams();
    const [chartData, setChartData] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`http://${config.stocksApiUrl}/stocks/${stockSymbol}`);
				const data = await response.json();
				setChartData(data.data);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		fetchData();
	}, [stockSymbol]);
				
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`/stocks/${stockSymbol}/info`);
    };
    
	return (
    <Container maxWidth="lg">
        {/* Head */}
        <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
            {stockSymbol || "Stock"}
        </Typography>
        <Typography variant="h6" gutterBottom fontStyle={{ color: 'gray' }}>
            {stockSymbol || "Stock"}
        </Typography>
        </Box>

        {/* Main Content */}
        <Box mt={4}>
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
            Candlestick Chart for {stockSymbol || "Stock"}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
            Below is a candlestick chart showcasing stock performance over time.
            </Typography>
            <CandlestickChart data={chartData} width={800} height={400} />
        </Paper>
        </Box>

        {/* Additional Information */}
        <Box mt={4}>
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, cursor: 'pointer' }} onClick={handleClick}>
                <Typography variant="h6" gutterBottom>
                종목 정보
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize={{ color: 'gray'}}>
                해당 종목의 정보를 확인
                </Typography>
            </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                Latest News
                </Typography>
                <Typography variant="body2" color="text.secondary">
                Stay updated with the latest trends and news in the stock market.
                </Typography>
            </Paper>
            </Grid>
        </Grid>
        </Box>
  </Container>
  );
};

export default Stocks;
