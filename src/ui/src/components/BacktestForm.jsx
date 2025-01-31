import React, { useState } from "react";
import { TextField, Typography, Button, MenuItem, Checkbox, FormControlLabel, Select, InputAdornment, Card, Box, CardContent } from "@mui/material";

const BacktestForm = ({ onSubmit }) => {
  const [params, setParams] = useState({
    start_date: "",
    end_date: "",
    initial_capital: 10000,
    cashflow: 0,
    cashflow_freq: "Yearly",
    adjustInflation: false,
    portfolio: [{ ticker: "", weight: 0 }],
  });

  // 포트폴리오 항목 추가/삭제
  const addTicker = () => setParams({ ...params, portfolio: [...params.portfolio, { ticker: "", weight: 0 }] });
  const removeTicker = (index) => {
    const newPortfolio = params.portfolio.filter((_, i) => i !== index);
    setParams({ ...params, portfolio: newPortfolio });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: "auto", mt: 4 }}>
      <Card sx={{ flexGrow: 1, marginBottom: 2 }}>
        <CardContent>
          <Typography variant="h4" component="div">
            Welcome to Backtest!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a simple backtest tool for evaluating stock performance.
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ padding: 2 }}>
        <Typography variant="h5">Backtest Parameters</Typography>
        <CardContent>
          <form>
            {/* 글로벌 파라미터 입력 */}
            <Box sx={{ display: "flex", gap: 2, marginBottom: 4, justifyContent: "space-between"}}>
              <TextField type="date" label="Start Date" fullWidth value={params.start_date} onChange={(e) => setParams({ ...params, start_date: e.target.value })} slotProps={{ inputLabel: {shrink:true}}}/>
              <TextField type="date" label="End Date" fullWidth value={params.end_date} onChange={(e) => setParams({ ...params, end_date: e.target.value })} slotProps={{ inputLabel: {shrink:true}}}/>
            </Box>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 4, justifyContent: "space-between"}}>
              <TextField
                type="number"
                label="Starting Value"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                value={params.initial_capital}
                onChange={(e) => setParams({ ...params, initial_capital: Number(e.target.value) })}
              />
              <TextField
                type="number"
                label="Cashflow"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                value={params.cashflow}
                onChange={(e) => setParams({ ...params, cashflow: Number(e.target.value) })}
              />
              <Select value={params.cashflow_freq} fullWidth onChange={(e) => setParams({ ...params, cashflow_freq: e.target.value })}>
                <MenuItem value="Yearly">Yearly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 2, justifyContent: "space-between"}}>
              <FormControlLabel
                control={<Checkbox checked={params.adjustInflation} onChange={(e) => setParams({ ...params, adjustInflation: e.target.checked })} />}
                label="Adjust for inflation"
              />
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* 포트폴리오 구성 */}
      <Card sx={{ padding: 2, flexGrow: 1, marginBottom: 2 }}>
        <Typography variant="h5">Portfolio</Typography>
        <CardContent>
          <div>
            {params.portfolio.map((item, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                <TextField
                  label="Ticker"
                  value={item.ticker}
                  onChange={(e) => {
                    const newPortfolio = [...params.portfolio];
                    newPortfolio[index].ticker = e.target.value;
                    setParams({ ...params, portfolio: newPortfolio });
                  }}
                />
                <TextField
                  type="number"
                  label="Weight (%)"
                  value={item.weight}
                  onChange={(e) => {
                    const newPortfolio = [...params.portfolio];
                    newPortfolio[index].weight = Number(e.target.value);
                    setParams({ ...params, portfolio: newPortfolio });
                  }}
                />
                <Button onClick={() => removeTicker(index)}>❌</Button>
              </div>
            ))}
            <Button onClick={addTicker}>+ Add Ticker</Button>
          </div>
        </CardContent>
      </Card>
      

      {/* 백테스트 실행 버튼 */}
      <Button variant="contained" onClick={() => onSubmit(params)}>
        BACKTEST
      </Button>
    </Box>
  );
};

export default BacktestForm;
