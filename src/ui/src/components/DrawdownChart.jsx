import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { Typography, Box, Card, CardContent } from "@mui/material";

// 차트에 넣을 수 있도록 데이터 변환
const transformDataForNivo = (drawdown, date) => {
    return drawdown.map(item => {
        const id = Object.keys(item)[0]; // portfolio 이름
        const values = item[id]; // 해당 portfolio의 drawdown list
  
        return {
            id,
            data: date.map((dateStr, index) => ({
                x: dateStr,
                y: values[index]
            }))
        };
    });
  };

const DrawdownChart = ({ drawdown, date }) => {
  const chartData = transformDataForNivo(drawdown, date)
  return (
    <Box>
        <Card sx={{ padding: 2, flexGrow: 1, marginBottom: 2 }}>
            <Typography variant="h5">Drawdown</Typography>
            <CardContent>
                <div style={{ height: 600 }}>
                    <ResponsiveLine
                    data={chartData}
                    margin={{ top: 30, right: 50, bottom: 50, left: 60 }}
                    xScale={{ type: "time", format:"%Y-%m-%d" }}
                    yScale={{ type: "linear", min: "auto", max: "auto" }}
                    xFormat="time:%Y-%m-%d"
                    yFormat=" >-.2f"
                    axisBottom={{ legend: "Date", format: "%Y-%m-%d", legendOffset: 30, legendPosition: "middle" }}
                    axisLeft={{ legend: "DrawDown", legendOffset: -40, legendPosition: "middle" }}
                    colors={{ scheme: "category10" }}
                    lineWidth={2}
                    pointSize={6}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                    useMesh={true}
                    legends={[
                        {
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateX: 100,
                        translateY: 50,
                        itemsSpacing: 0,
                        itemDirection: "left-to-right",
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: "circle",
                        symbolBorderColor: "rgba(0, 0, 0, .5)",
                        effects: [
                            {
                            on: "hover",
                            style: {
                                itemBackground: "rgba(0, 0, 0, .03)",
                                itemOpacity: 1,
                            },
                            },
                        ],
                        },
                    ]}
                    />
                </div>
            </CardContent>
        </Card>
    </Box>
  );
};

export default DrawdownChart;
