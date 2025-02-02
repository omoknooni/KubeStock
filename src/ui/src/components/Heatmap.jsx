import React, { useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography } from "@mui/material";

const Heatmap = () => {
    const heatmapRef = useRef(null);

    useEffect(() => {
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
            blockColor: "change",
            symbolUrl: "http://localhost:3000/stocks/symbol",    // Redirect to ${symbolUrl}/?tvwidgetsymbol={symbol}
            hasTopBar: false,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            colorTheme: "dark",
            hasSymbolTooltip: true,

        });
        heatmapRef.current.appendChild(heatmapWidget);
    }, []);

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