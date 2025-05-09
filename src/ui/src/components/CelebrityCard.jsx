// CelebrityCard.jsx
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Typography,
  Button,
  Drawer,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import ComparisonModal from './ComparisonModal';
import CelebrityPortfolioChart from './CelebrityPortfolioChart';

// API 응답을 nivo 도넛 차트용 데이터로 변환
const transformHoldingsToChartData = (holdings, topN = 8) => {
  const sorted = [...holdings].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, topN);
  const others = sorted.slice(topN);
  const othersValue = others.reduce((sum, h) => sum + h.value, 0);

  const chartData = top.map((h, idx, arr) => ({
      id: h.issuer,
      label: h.issuer,
      value: h.value,
      color: `hsl(${Math.round((idx * 360) / arr.length)}, 70%, 50%)`,
  }));
  if (othersValue > 0) {
    chartData.push({ id: 'Others', label: 'Others', value: othersValue, color: 'hsl(0, 0%, 80%)' });
  }
  return chartData;
};

export default function CelebrityCard({ name, cik, img, desc }) {
    const [portfolio, setPortfolio] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openDrawer, setOpenDrawer] = useState(false);
  
    const loadPortfolio = async () => {
      if (portfolio) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/portfolio_overview/${cik}`);
        if (!res.ok) throw new Error('포트폴리오 조회 실패');
        const json = await res.json();
        setPortfolio(json.holdings);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    const handleOpen = () => {
      loadPortfolio();
      setOpenDrawer(true);
    };

  return (
    <>
      <Card>
        <CardMedia component="img" image={img} alt={name} sx={{ width: "100%", height: 'auto' }} />
        <CardContent>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body2">{desc}</Typography>
        </CardContent>
        <CardActions>
          <Button fullWidth onClick={handleOpen}>
            포트폴리오 보기
          </Button>
        </CardActions>
      </Card>

      <Drawer anchor="bottom" open={openDrawer} onClose={() => setOpenDrawer(false)} ModalProps={{ keepMounted: true }}>
        <Box sx={{ width: "100%", p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {name} 포트폴리오
          </Typography>
          <Typography variant="body2" align="center" paragraph>
            {desc}
          </Typography>
          {loading && <CircularProgress />}
          {error && <Typography color="error">{error}</Typography>}
          {portfolio && (
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2, flex: 1, minHeight: 400, alignItems: 'center' }}>
              {/* 차트 영역 */}
              <CelebrityPortfolioChart data={transformHoldingsToChartData(portfolio)} />

              {/* Table 영역 */}
              <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Issuer</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Shares</TableCell>
                      <TableCell align="right">Rate (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio.map((h) => (
                      <TableRow key={h.cusip} hover>
                        <TableCell>{h.issuer}</TableCell>
                        <TableCell align="right">{h.value.toLocaleString()}</TableCell>
                        <TableCell align="right">{h.shares.toLocaleString()}</TableCell>
                        <TableCell align="right">{h.holding_rate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}

          {portfolio && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDrawer(false)}
            >
              닫기
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenModal(true)}
            >
              이전 분기 비교
            </Button>
          </Box>
          )}
        </Box>
      </Drawer>

      <ComparisonModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        cik={cik}
      />
    </>
  );
}
