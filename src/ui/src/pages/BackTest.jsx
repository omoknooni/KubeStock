import React, { useState } from "react";
import axios from "axios";
import CandlestickChart from "../components/LightChart";
import config from "../config/apiConfig";

import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

function Backtest() {
  // State for form inputs
  const [inputs, setInputs] = useState({
    ticker: "",
    strategy: "sma",
    initial_cash: 100000,
    start_date: "",
    end_date: "",
    commission: 0.001,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]:
        name === "initial_cash" || name === "commission"
          ? parseFloat(value)
          : value,
    }));
  };

  // Fetch backtest results
  const fetchBacktestResult = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post(`${config.backtestApiUrl}/run`, inputs);
      setResult(response.data);
    } catch (err) {
      setError("Failed to fetch data. Please check the server or your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // Chart data configuration
  //   const chartData = result
  //     ? {
  //         labels: result.timestamps, // Replace with actual timestamps from API
  //         datasets: [
  //           {
  //             label: "Portfolio Value",
  //             data: result.portfolio_values, // Replace with actual portfolio values from API
  //             borderColor: "blue",
  //             fill: false
  //           }
  //         ]
  //       }
  //     : null;

  const chartData =
    result?.candlestick_data?.map((item) => ({
      time: item.time, // Expecting timestamp from API
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    })) || [];

  return (
    <Container maxWidth="md" style={{ paddingTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Backtesting Tool
      </Typography>
      <Box component="form" onSubmit={(e) => e.preventDefault()} mb={4}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Ticker"
              name="ticker"
              value={inputs.ticker}
              onChange={handleChange}
              placeholder="AAPL, TSLA, etc."
              required
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel id="strategy-label">Strategy</InputLabel>
              <Select
                labelId="strategy-label"
                name="strategy"
                value={inputs.strategy}
                onChange={handleChange}
                required
              >
                <MenuItem value="sma">Simple Moving Average</MenuItem>
                <MenuItem value="rsi">RSI</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Initial Cash ($)"
              name="initial_cash"
              value={inputs.initial_cash}
              onChange={handleChange}
              inputProps={{ min: 1000, step: 1000 }}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Commission"
              name="commission"
              value={inputs.commission}
              onChange={handleChange}
              inputProps={{ min: 0, max: 0.1, step: 0.001 }}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              name="start_date"
              value={inputs.start_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              name="end_date"
              value={inputs.end_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={fetchBacktestResult}
              disabled={loading}
            >
              {loading ? "Loading..." : "Run Backtest"}
            </Button>
          </Grid>
        </Grid>
      </Box>
      {error && (
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
      )}
      {result && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Backtest Summary
          </Typography>
          <Typography>
            <strong>Ticker:</strong> {result.ticker}
          </Typography>
          <Typography>
            <strong>Strategy:</strong> {result.strategy}
          </Typography>
          <Typography>
            <strong>Sharpe Ratio:</strong> {result.sharpe_ratio.toFixed(2)}
          </Typography>
          <Typography>
            <strong>Max Drawdown:</strong> {result.max_draw_down.toFixed(2)}%
          </Typography>
          <Typography>
            <strong>Final Portfolio Value:</strong> $
            {result.final_portfolio_value.toFixed(2)}
          </Typography>
          <Box mt={4}>
            <Typography variant="h6">Portfolio Performance</Typography>
						<CandlestickChart data={chartData} />
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default Backtest;
