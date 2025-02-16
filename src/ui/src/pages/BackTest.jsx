import React, { useState } from "react";
import BacktestForm from "../components/BacktestForm";
import PerformanceChart from "../components/PerformanceChart";
import DrawdownChart from "../components/DrawdownChart";
import apiConfig from "../config/apiConfig";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

const BacktestPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleBacktest = async (params) => {
    try {
      const response = await fetch(`${apiConfig.backtestApiUrl}/api/backtest/run`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`API error! ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      setError(error.message);
    }
  };
  document.title = "Backtest | KubeStock";
  return (
    <div>
      <BacktestForm onSubmit={handleBacktest} />
      {/* TODO: 여러 포트폴리오 출력 */}
      {data && <PerformanceChart performance={data.performance} annual_returns={data.annual_returns} date={data.date} />}
      {data && <DrawdownChart drawdown={data.drawdown} date={data.date} />}

      {/* 🔹 오류 발생 시 경고 모달 */}
      <Dialog open={!!error} onClose={() => setError(null)}>
        <DialogTitle>⚠ 오류 발생</DialogTitle>
        <DialogContent>{error}</DialogContent>
        <DialogActions>
          <Button onClick={() => setError(null)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BacktestPage;
