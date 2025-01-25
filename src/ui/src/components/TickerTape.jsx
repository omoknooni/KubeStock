import React, { useEffect, useRef } from "react";

const TickerTape = () => {
    const tickerTapeRef = useRef(null);

    useEffect(() => {
        const removeTickerTape = () => {
            if (tickerTapeRef.current) {
                tickerTapeRef.current.innerHTML = "";
            }
        };

        removeTickerTape();

        const TickerTapeWidget = document.createElement("script");
        TickerTapeWidget.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
        TickerTapeWidget.async = true;
        TickerTapeWidget.innerHTML = JSON.stringify({
            symbols: [
                {
                    description: "S&P 500",
                    proName: "FOREXCOM:SPXUSD"
                },
                {
                    description: "Nasdaq 100",
                    proName: "OANDA:NAS100USD"
                },
                {
                    description: "Dow 30",
                    proName: "BLACKBULL:US30"
                },
                {
                    description: "USD/KRW",
                    proName: "FX_IDC:USDKRW"
                },
                {
                    description: "VIX",
                    proName: "CAPITALCOM:VIX"
                }
            ],
            colorTheme: "light",
            isTransparent: false,
            showSymbolLogo: true,
            displayMode: "adaptive",
            locale: "kr",
        });
        tickerTapeRef.current.appendChild(TickerTapeWidget);
    }, []); // 빈 배열을 넣어 컴포넌트 마운트 시에만 실행

    return (
        <div className="tradingview-widget-container" ref={tickerTapeRef} style={{ width: "100%", position: "fixed", bottom: 0, left:0 }}>
            <div className="tradingview-widget-container__widget"></div>
            <div className="tradingview-widget-copyright">
                <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
                    <span className="blue-text">실시간 시세</span>
                </a>
            </div>
        </div>
    );
};

export default TickerTape;