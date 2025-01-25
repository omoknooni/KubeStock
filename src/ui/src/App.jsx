import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, TextField, IconButton, Menu, MenuItem } from '@mui/material';
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Stocks from "./pages/Stocks";
import StockInfo from "./pages/StockInfo";
import News from "./pages/News";
import Backtest from "./pages/BackTest";
import TickerTape from "./components/TickerTape";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stocks/:stockSymbol" element={<Stocks />} />
        <Route path="/stocks/:stockSymbol/info" element={<StockInfo />} />
        <Route path="/news" element={<News />} />
        <Route path="/backtest" element={<Backtest />} />
      </Routes>
      <TickerTape />
    </Router>
  );
};

export default App;
