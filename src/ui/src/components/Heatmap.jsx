import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography } from "@mui/material";

const Heatmap = () => {
    const heatmapRef = useRef(null);
    const [blockColor, setBlockColor] = useState("change 1h");

    const fetchStatus = async () => {
        try {
            const response = await fetch(`/api/stocks/market-status`);
            if (!response.ok) {
                throw new Error(`API error! ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const statusMap = {
                "open": "change|60",
                "extended-hours": "premarket_change",
                "after-hours": "postmarket_change",
                "closed": "change|60",
            };
            setBlockColor(statusMap[data.blockColor]);
        } catch (error) {
            console.error("Error fetching status:", error);
        }
    }

    useEffect(() => {
        // market status API call
        fetchStatus();

        const heatmapWidget = document.createElement("script");
        heatmapWidget.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
        heatmapWidget.async = true;
        heatmapWidget.innerHTML = JSON.stringify({
            width: "100%",
            height: 800,
            dataSource: "SPX500",
            grouping: "sector",
            locale: "kr",
            blockSize: "market_cap_basic",
            blockColor: blockColor,
            symbolUrl: `${window.location.origin}/stocks/symbol`,    // Redirect to ${symbolUrl}/?tvwidgetsymbol={symbol}
            hasTopBar: false,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            colorTheme: "dark",
            hasSymbolTooltip: true,

        });
        heatmapRef.current.appendChild(heatmapWidget);
    }, [blockColor]);

    return (
        <Card sx={{ marginTop: 2, width: "100%", height: "100%" }}>
            <Typography variant='h4' gutterBottom sx={{ marginTop: 2, marginLeft: 1 }}>
                Stock HeatMap
            </Typography>
            <CardContent sx={{ height: "95%" }}>
                <div className="tradingview-widget-container" ref={heatmapRef}></div>
            </CardContent>
        </Card>
    );
};

export default Heatmap;