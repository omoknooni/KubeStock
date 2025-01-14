import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, TextField, IconButton, Menu, MenuItem, Icon } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ onSearch }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      const stockSymbol = searchValue.trim().toUpperCase();
      navigate(`/stocks/${stockSymbol}`);
      setSearchValue('');
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar>
        {/* 메뉴 아이콘 */}
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuOpen}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* 로고 또는 타이틀 */}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Trading Dashboard
        </Typography>

        {/* 메뉴 버튼 */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            Home
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/news')}>
            News
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/backtest')}>
            Backtest
          </IconButton>
        </Box>


        {/* 검색바 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search stock..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={{
              backgroundColor: '#fff',
              borderRadius: 1,
            }}
          />
          <IconButton color="inherit" onClick={handleSearchSubmit}>
            <SearchIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
