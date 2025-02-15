import React, { useState, useEffect, useRef } from "react";
import { TextField, Typography, Button, MenuItem, Checkbox, FormControlLabel, Select, InputAdornment, Card, Box, CardContent, CircularProgress, Autocomplete } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";

const BacktestForm = ({ onSubmit }) => {
  const [params, setParams] = useState({
    start_date: "",
    end_date: "",
    initial_capital: 10000,
    cashflow: 0,
    cashflow_freq: "yearly",
    adjustInflation: false,
    portfolio: [],
  });
  const [portfolios, setPortfolios] = useState([]);
  const [editingTickers, setEditingTickers] = useState([]);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]); // 자동완성 결과 저장
  const [loading, setLoading] = useState(false); // API 요청 상태
  const debounceTimerRef = useRef(null);

  const fetchTickerSuggestions = async (query, setSuggestions, setLoading) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // const response = await fetch("/api/stocks/search", {
      const response = await fetch("http://localhost:8000/api/stocks/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      // const data = [
      //   {"ticker": "AAPL", "name": "APPLE Inc."},
      // ]
      console.log(data);
      setSuggestions(data); // 자동완성 리스트 업데이트
    } catch (error) {
      console.error("Error fetching ticker suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateInputs = () => {
    const newErrors = {};

    // Parameters 필수 값 검증
    if (!params.start_date) newErrors.start_date = "Start date is required";
    if (!params.end_date) newErrors.end_date = "End date is required";
    if (!params.initial_capital) newErrors.initial_capital = "Initial capital is required";

    // Portfolio 이름 검증
    portfolios.forEach((portfolio, index) => {
      if (!portfolio.name.trim()) {
        newErrors[`portfolio_${index}_name`] = `Portfolio ${index + 1} name is required`;
      }
    });

    setErrors(newErrors);

    // 에러가 없으면 true, 있으면 false 반환
    return Object.keys(newErrors).length === 0;
  };

  // 포트폴리오 객체 추가/삭제
  const addPortfolio = () => {
    setPortfolios([...portfolios, {
      name: "",
      allocation: {},
      drag: 0,
      invest_dividends: true,
      rebalance_freq: "monthly"
    }]);
  };
  const removePortfolio = (index) => {
    const newPortfolios = portfolios.filter((_, i) => i !== index);
    setPortfolios(newPortfolios);
  };
  const updatePortfolio = (index, field, value) => {
    const newPortfolios = [...portfolios];
    newPortfolios[index][field] = value;
    setPortfolios(newPortfolios);
  };
  
  // 포트폴리오 내의 종목 추가/삭제
  const addTicker = (index) => {
    const updatedPortfolios = [...portfolios];
    updatedPortfolios[index].allocation[""] = 0;
    setPortfolios(updatedPortfolios);

    setEditingTickers((prev) => ({
      ...prev,
      [`${index}-`]: "",
    }));
  };

  const updateTicker = (index, oldKey, newKey, value) => {
    setPortfolios((prevPortfolios) => {
      return prevPortfolios.map((portfolio, i) => {
        if (i !== index) return portfolio;
        
        // 기존 객체를 변경하지 않고 새로운 객체 생성
        const updatedAllocation = { ...portfolio.allocation };
        
        // ticker 이름이 변경된 경우
        if (oldKey !== newKey) {
          delete updatedAllocation[oldKey];
        }
        updatedAllocation[newKey] = value;
        
        return { ...portfolio, allocation: updatedAllocation };
      });
    });
  };

  // AutoComplete에서 입력값이 변할 때 처리
  const handleTickerChange = (index, oldKey, newKey) => {
    setEditingTickers((prev) => ({
      ...prev,
      [`${index}-${oldKey}`]: newKey, // 현재 입력 중인 값을 별도 저장
    }));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 백엔드 API 호출해서 입력한 값에 대한 결과 fetch
    // fetchTickerSuggestions(newKey);
    debounceTimerRef.current = setTimeout(() => {
      fetchTickerSuggestions(newKey, setSuggestions, setLoading);
    }, 500);
 };
  
  const handleTickerBlur = (index, oldKey) => {
    setPortfolios((prevPortfolios) => {
      return prevPortfolios.map((portfolio, i) => {
        if (i !== index) return portfolio;
  
        const updatedAllocation = { ...portfolio.allocation };
        const newKey = editingTickers[`${index}-${oldKey}`] || oldKey;
  
        // 키 변경이 있는 경우
        if (newKey !== oldKey) {
          delete updatedAllocation[oldKey];
        }
        updatedAllocation[newKey] = updatedAllocation[oldKey] || 0;
  
        return { ...portfolio, allocation: updatedAllocation };
      });
    });

    // 입력 중 상태에서 제거
    setEditingTickers((prev) => {
      const newEditingTickers = { ...prev };
      delete newEditingTickers[`${index}-${oldKey}`];
      return newEditingTickers;
    });
  };
  
  const removeTicker = (index, ticker) => {
    const updatedPortfolios = [...portfolios];
    delete updatedPortfolios[index].allocation[ticker];
    setPortfolios(updatedPortfolios);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "80%", mt: 4, mx: "auto" }}>
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
              <TextField 
                required 
                type="date" 
                label="Start Date"
                fullWidth 
                value={params.start_date} 
                onChange={(e) => setParams({ ...params, start_date: e.target.value })}
                error={!!errors.start_date}
                helperText={errors.start_date}
                slotProps={{ inputLabel: {shrink:true}}}
                />
              <TextField
                required
                type="date"
                label="End Date"
                fullWidth
                value={params.end_date}
                onChange={(e) => setParams({ ...params, end_date: e.target.value })}
                error={!!errors.end_date}
                helperText={errors.end_date}
                slotProps={{ inputLabel: {shrink:true}}}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 4, justifyContent: "space-between"}}>
              <TextField
                required
                type="number"
                label="Starting Value"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                value={params.initial_capital}
                onChange={(e) => setParams({ ...params, initial_capital: Number(e.target.value) })}
                error={!!errors.initial_capital}
                helperText={errors.initial_capital}
              />
              <TextField
                required
                type="number"
                label="Cashflow"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                value={params.cashflow}
                onChange={(e) => setParams({ ...params, cashflow: Number(e.target.value) })}
              />
              <Select value={params.cashflow_freq} fullWidth onChange={(e) => setParams({ ...params, cashflow_freq: e.target.value })}>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </Box>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 2, justifyContent: "space-between"}}>
              <FormControlLabel
                control={<Checkbox checked={params.adjustInflation} onChange={(e) => setParams({ ...params, adjustInflation: e.target.checked })} />}
                label="Adjust for inflation"
              />
            </Box>
          </form>
          {/* 백테스트 실행 버튼 */}
          <Button variant="contained" onClick={() => { 
            if (validateInputs()) {
              const updatedParams = { ...params, portfolio: portfolios};
              onSubmit(updatedParams);
            }
          }}
          >
            BACKTEST
          </Button>
        </CardContent>
      </Card>

      {/* 포트폴리오 구성 */}
      <Card sx={{ padding: 2, flexGrow: 1, marginBottom: 2 }}>
        <Typography variant="h5">Portfolio</Typography>
        <CardContent>
          <div>
            <Button onClick={addPortfolio} variant="contained" disabled={portfolios.length >= 4} sx={{ marginBottom: 2 }}>+ Add Portfolio</Button> 
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "flex-start"}}>
              {portfolios.map((portfolio, index) => (
                <Card key={index} sx={{ width: "24%", marginBottom: 2}}>
                  <CardContent>
                    <div style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
                      <TextField
                        required
                        label="Portfolio Name"
                        value={portfolio.name}
                        onChange={(e) => updatePortfolio(index, "name", e.target.value)}
                        error={!!errors[`portfolio_${index}_name`]}
                        helperText={errors[`portfolio_${index}_name`]}
                        sx={{marginBottom:1, marginRight: 1, width: "60%"}}
                      />

                      <Select
                        value={portfolio.rebalance_freq}
                        onChange={(e) => updatePortfolio(index, "rebalance_freq", e.target.value)}
                        sx={{}}
                      >
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                        <MenuItem value="yearly">Yearly</MenuItem>
                      </Select>

                      <TextField 
                        label="Drag (%)"
                        type="number"
                        value={portfolio.drag}
                        onChange={(e) => updatePortfolio(index, "drag", parseFloat(e.target.value))}
                        sx={{marginBottom:1, marginRight: 1, width: "40%"}}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={portfolio.invest_dividends}
                            onChange={(e) => updatePortfolio(index, "invest_dividends", e.target.checked)}
                          />
                        }
                        label="Invest Dividends"
                      />

                      <Typography variant="h6" gutterBottom>Ticker</Typography>
                      <Button variant="outlined" onClick={() => addTicker(index)}>
                        Add Ticker
                      </Button>

                      {Object.entries(portfolio.allocation).map(([ticker, percentage]) => (
                        <div key={ticker} style={{ display: "flex", gap: "10px", marginTop: "5px", justifyContent: "space-between"}}>
                          {/* <TextField
                            label="Ticker"
                            value={editingTickers[`${index}-${ticker}`] ?? ticker}
                            onChange={(e) => handleTickerChange(index, ticker, e.target.value)}
                            onBlur={() => handleTickerBlur(index, ticker)}
                          /> */}
                        <Autocomplete
                          freeSolo
                          sx={{ width: "80%" }}
                          options={suggestions}
                          getOptionLabel={(option) => `${option.ticker}`}
                          value={{ ticker: editingTickers[`${index}-${ticker}`] ?? ticker }}
                          onInputChange={(event, newInputValue) => handleTickerChange(index, ticker, newInputValue)}
                          onChange={(event, newValue) => {
                            if (newValue) {
                              const selectedTicker = newValue.ticker;
                              updateTicker(index, ticker, selectedTicker, portfolio.allocation[ticker] || 0);
                              setEditingTickers((prev) => ({
                                ...prev,
                                [`${index}-${selectedTicker}`]: selectedTicker,
                              }));
                              setSuggestions([]);
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Ticker"
                              fullWidth
                              value={editingTickers[`${index}-${ticker}`] ?? ticker}
                              onBlur={() => handleTickerBlur(index, ticker)}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />

                          <TextField
                            label="Allocation (%)"
                            type="number"
                            value={percentage}
                            onChange={(e) => updateTicker(index, ticker, ticker, parseFloat(e.target.value))}
                          />
                          <RemoveIcon onClick={() => removeTicker(index, ticker)}/>
                        </div>
                      ))}

                      <Button variant="contained" color="error" onClick={() => removePortfolio(index)}>
                        Remove Portfolio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BacktestForm;
