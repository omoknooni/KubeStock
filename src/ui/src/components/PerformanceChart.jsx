import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Card, CardContent,Typography } from "@mui/material";

// annual_return 테이블 출력을 위한 변환
const transformData = (data) => {
  const years = new Set();
  const columns = {};

  data.forEach((entry) => {
    Object.entries(entry).forEach(([key, values]) => {
      values.forEach(({ year, return: returnValue }) => {
        years.add(year);
        if (!columns[year]) columns[year] = {};
        columns[year][key] = returnValue;
      });
    });
  });

  return { years: Array.from(years).sort(), columns };
};

// 차트에 넣을 수 있도록 데이터 변환
const transformDataForNivo = (performance, date) => {
  return performance.map(item => {
      const id = Object.keys(item)[0]; // portfolio 이름
      const values = item[id]; // 해당 portfolio의 performance list

      return {
          id,
          data: date.map((dateStr, index) => ({
              x: dateStr,
              y: values[index]
          }))
      };
  });
};

const PerformanceChart = ({ performance, annual_returns, date }) => {
  const chartData = transformDataForNivo(performance, date);
  const { years, columns } = transformData(annual_returns);
  const columnKeys = Object.keys(columns[years[0]] || {});

  return (
    <Box sx={{ marginTop: 4 }}>
      <Card sx={{ padding: 2, flexGrow: 1, marginBottom: 2 }}>
        <Typography variant="h5">Performance</Typography>
        <CardContent>
          <div style={{ height: 600 }}>
            <ResponsiveLine
              data={chartData}
              margin={{ top: 20, right: 50, bottom: 50, left: 60 }}
              xScale={{ type: "time", format:"%Y-%m-%d" }}
              yScale={{ type: "linear", min: "auto", max: "auto" }}
              xFormat="time:%Y-%m-%d"
              yFormat=" >-.2f"
              axisBottom={{ legend: "Date", format: "%Y-%m-%d", legendOffset: 30, legendPosition: "middle" }}
              axisLeft={{ legend: "Portfolio Value", legendOffset: -50, legendPosition: "middle" }}
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

      {/* 연도별 수익률 표 */}
      <Card sx={{ marginBottom: 1 }}>
        <Box sx={{ padding: 1 }}>
          <Typography variant="h5">Annual Returns</Typography>
        </Box>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  {columnKeys.map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {years.map((year) => (
                  <TableRow key={year}>
                    <TableCell>{year}</TableCell>
                    {columnKeys.map((key) => (
                      <TableCell key={key}>{columns[year][key] !== undefined ? (columns[year][key] * 100).toFixed(2) + "%" : "-"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceChart;
