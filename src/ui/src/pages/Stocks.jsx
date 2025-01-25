import React, { useEffect, useRef } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

const Stocks = () => {
    const { stockSymbol } = useParams();
    const chartRef = useRef(null);
    const symbolInfoRef = useRef(null);
    const technicalAnalysisRef = useRef(null);

    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`/stocks/${stockSymbol}/info`);
    };
    
    useEffect(() => {
        document.title = `${stockSymbol} | KubeStock`;
        const removeOldWidgets = () => {
            const chartContainer = chartRef.current;
            const symbolInfoContainer = symbolInfoRef.current;
            const technicalAnalysisContainer = technicalAnalysisRef.current;

            if (chartContainer) {
                chartContainer.innerHTML = "";
            }
            if (symbolInfoContainer) {
                symbolInfoContainer.innerHTML = "";
            }
            if (technicalAnalysisContainer) {
                technicalAnalysisContainer.innerHTML = "";
            }
        };
        removeOldWidgets();
        
        // Symbol Info Widget
        const symbolInfoWidget = document.createElement("script");
        symbolInfoWidget.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
        symbolInfoWidget.async = true;
        symbolInfoWidget.innerHTML = JSON.stringify({
            symbol: stockSymbol || "NASDAQ:AAPL",
            width: "100%",
            locale: "kr",
            colorTheme: "light",
            isTransparent: false,
            height: 200,
        });
        symbolInfoRef.current.appendChild(symbolInfoWidget);

        // Advanced Real-time Chart Widget
        const ARTchartWidget = document.createElement("script");
        ARTchartWidget.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        ARTchartWidget.async = true;
        ARTchartWidget.innerHTML = JSON.stringify({
            autosize: true,
            symbol: stockSymbol || "NASDAQ:AAPL",
            interval: "D",
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "kr",
            toolbar_bg: "#f1f3f6",
            height: 600,
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            details: true,
            hotlist: true,
            calendar: true,
        });
        chartRef.current.appendChild(ARTchartWidget);

        // Technicl Analysis Widget
        const TechnicalAnalysisWidget = document.createElement("script");
        TechnicalAnalysisWidget.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
        TechnicalAnalysisWidget.async = true;
        TechnicalAnalysisWidget.innerHTML = JSON.stringify({
            interval: "1D",
            width: "100%",
            isTransparent: false,
            height: 400,
            symbol: stockSymbol || "NASDAQ:AAPL",
            showIntervalTabs: true,
            locale: "kr",
            colorTheme: "light",
        });
        technicalAnalysisRef.current.appendChild(TechnicalAnalysisWidget);
    }, [stockSymbol]);

	return (
    <Box sx={{ padding: 2, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
        {/* Symbol Info Widget */}
        <Card sx={{ marginBottom: 2 }}>
          <CardContent>
            <div className="tradingview-widget-container" ref={symbolInfoRef} style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ width: "100%" }}></div>
                <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
            </div>
          </CardContent>
        </Card>
  
        {/* Advanced Real-Time Chart */}
        <Card sx={{ flexGrow: 1, marginBottom: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-Time Chart
            </Typography>
            <div className="tradingview-widget-container" ref={chartRef} style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ width: "100%" }}></div>
                <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
            </div>
          </CardContent>
        </Card>
  
        {/* Technical Analysis Widget */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Technical Analysis
            </Typography>
            <div className="tradingview-widget-container" ref={technicalAnalysisRef} style={{ height: "100%", width: "100%" }}>
                <div className="tradingview-widget-container__widget" style={{ width: "100%" }}></div>
                <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
            </div>
          </CardContent>
        </Card>
    </Box>
  );
};

export default Stocks;
