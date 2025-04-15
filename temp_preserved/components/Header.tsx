import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ArchitectureIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import StorageIcon from '@mui/icons-material/Storage';

const navLinks = [
  { title: 'ホーム', path: '/', icon: <HomeIcon /> },
  { title: '建築作品', path: '/architecture', icon: <ArchitectureIcon /> },
  { title: '建築家', path: '/architects', icon: <PeopleIcon /> },
  { title: 'マップ', path: '/map', icon: <MapIcon /> },
  { title: 'DBエクスプローラー', path: '/db-explorer', icon: <StorageIcon /> }
];

const Header = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1, 
            color: 'white',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          建築データベース
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
            >
              <Box
                sx={{ width: 250 }}
                role="presentation"
                onClick={toggleDrawer(false)}
                onKeyDown={toggleDrawer(false)}
              >
                <List>
                  {navLinks.map(({ title, path, icon }) => (
                    <ListItem
                      button
                      component={RouterLink}
                      to={path}
                      key={title}
                      selected={location.pathname === path}
                    >
                      {icon}
                      <ListItemText primary={title} sx={{ ml: 2 }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box sx={{ display: 'flex' }}>
            {navLinks.map(({ title, path }) => (
              <Button
                key={title}
                component={RouterLink}
                to={path}
                color="inherit"
                sx={{
                  mx: 1,
                  fontWeight: location.pathname === path ? 'bold' : 'normal',
                  borderBottom: location.pathname === path ? '2px solid white' : 'none'
                }}
              >
                {title}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 