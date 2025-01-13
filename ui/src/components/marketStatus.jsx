import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const getMarketStatus = () => {
  const now = dayjs().tz("America/New_York");
  const time = now.format("HH:mm");

  if (time >= "09:30" && time < "16:00") return "Market Open";
  if (time >= "16:00" && time < "20:00") return "After Market Closed";
  if (time >= "04:00" && time < "09:30") return "Pre-Market Closed";
  return "Market Closed";
};

const MarketChip = styled(Chip)(({ theme, marketStatus }) => ({
  backgroundColor: marketStatus.includes("Open") ? "#4caf50" : "#f44336",
  color: "#fff",
  fontSize: "1rem",
  fontWeight: "bold",
}));

const MarketStatus = () => {
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = dayjs();
      setCurrentTime(now.format("HH:mm:ss"));

      const newStatus = getMarketStatus();
      if (newStatus !== marketStatus) {
        setMarketStatus(newStatus);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [marketStatus]);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <Typography variant="h4" sx={{ mb: 4, color: "#3f51b5" }}>
        📅 Real-Time Stock Market Status
      </Typography>

      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#ffffff",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <Typography variant="h5" gutterBottom>
          Current Time:
        </Typography>
        <Typography variant="h4" sx={{ mb: 2, color: "#ff5722" }}>
          {currentTime}
        </Typography>

        <Typography variant="h5" gutterBottom>
          Market Status:
        </Typography>
        <MarketChip label={marketStatus} marketStatus={marketStatus} />
      </Paper>
    </Box>
  );
};

export default MarketStatus;