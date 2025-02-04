import { Typography, Card, CardContent } from '@mui/material';
import { useRef } from 'react';
import React, { useEffect } from "react";

const EconomicCalender = () => {
    const EconomicCalenderRef = useRef(null);
    useEffect(() => {
        const EconomicCalenderWidget = document.createElement("script");
        EconomicCalenderWidget.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        EconomicCalenderWidget.async = true;
        EconomicCalenderWidget.innerHTML = JSON.stringify({
            width: "100%",
            height: 800,
            colorTheme: "light",
            isTransparent: false,
            locale: "kr",
            importanceFilter: "-1,0,1",
            countryFilter: "jp,kr,us,eu"
        });
        EconomicCalenderRef.current.appendChild(EconomicCalenderWidget);
    }, []);

    return (
        <Card sx={{ marginTop: 2, width: "30%"}}>
            <Typography variant='h4' gutterBottom sx={{ marginTop: 2, marginLeft: 1 }}>
                Economic Calender
            </Typography>
            <CardContent>
                <div className="tradingview-widget-container" ref={EconomicCalenderRef}></div>
            </CardContent>
        </Card>
    );
};

export default EconomicCalender;