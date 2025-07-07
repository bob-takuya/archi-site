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
import CloseIcon from '@mui/icons-material/Close';

interface NavLink {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  { title: 'ホーム', path: '/', icon: <HomeIcon /> },
  { title: '建築作品', path: '/architecture', icon: <ArchitectureIcon /> },
  { title: '建築家', path: '/architects', icon: <PeopleIcon /> },
  { title: 'マップ', path: '/map', icon: <MapIcon /> },
  { title: 'DBエクスプローラー', path: '/db-explorer', icon: <StorageIcon /> }
];

const Header: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <AppBar position="static" color="primary" component="nav" role="navigation" aria-label="メインナビゲーション">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          data-testid="site-title"
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
              data-testid="mobile-menu-button"
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <List role="menu" aria-label="ナビゲーションメニュー">
                  {navLinks.map(({ title, path, icon }) => (
                    <ListItem
                      component={RouterLink}
                      to={path}
                      key={title}
                      role="menuitem"
                      data-testid={`nav-link-${title.toLowerCase()}`}
                      sx={{
                        color: pathname === path ? 'primary.main' : 'text.primary',
                        backgroundColor: pathname === path ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                        fontWeight: pathname === path ? 'bold' : 'normal',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
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
          <Box sx={{ display: 'flex' }} role="menubar" aria-label="デスクトップナビゲーション">
            {navLinks.map(({ title, path }) => (
              <Button
                key={title}
                component={RouterLink}
                to={path}
                color="inherit"
                role="menuitem"
                data-testid={`nav-link-${title.toLowerCase()}`}
                sx={{
                  mx: 1,
                  fontWeight: pathname === path ? 'bold' : 'normal',
                  borderBottom: pathname === path ? '2px solid white' : 'none'
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