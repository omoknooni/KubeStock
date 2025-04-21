import React, { useEffect, useRef } from "react";
import { Box, Card, CardContent } from "@mui/material";

const EmbeddedWidget = () => {
    const newsRssUrl = "https://rss.app/embed/v1/ticker/_pHsElCXMfU2aDWLN"
    return (
        <Box sx={{ marginTop: 2, width: "100%", height: "40%" }}>
            <iframe
                src={newsRssUrl}
                width="100%"
                height="10%"
                style={{ border: "none" }}
                allowFullScreen
            ></iframe>
        </Box>
    );
};

export default EmbeddedWidget;
