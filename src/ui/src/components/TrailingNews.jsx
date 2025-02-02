import React, { useEffect, useRef } from "react";
import { Box, Card, CardContent } from "@mui/material";
import apiConfig from "../config/apiConfig";

const EmbeddedWidget = () => {
    return (
        <Box sx={{ marginTop: 2, width: "100%", height: "40%" }}>
            <iframe
                src={apiConfig.newsRssUrl}
                width="100%"
                height="10%"
                style={{ border: "none" }}
                allowFullScreen
            ></iframe>
        </Box>
    );
};

export default EmbeddedWidget;
