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
  useTheme,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ArchitectureIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloseIcon from '@mui/icons-material/Close';
import { LanguageSwitcher } from './i18n/LanguageSwitcher';
import { HighContrastToggle } from './accessibility/HighContrastToggle';
import { useTypedTranslation } from '../i18n';
import { useFocusTrap, useKeyboardNavigation } from '../utils/accessibility';

interface NavLink {
  titleKey: string;
  path: string;
  icon: React.ReactNode;
  ariaLabel?: string;
}

const navLinksConfig: Omit<NavLink, 'ariaLabel'>[] = [
  { titleKey: 'navigation.home', path: '/', icon: <HomeIcon /> },
  { titleKey: 'navigation.architecture', path: '/architecture', icon: <ArchitectureIcon /> },
  { titleKey: 'navigation.architects', path: '/architects', icon: <PeopleIcon /> },
  { titleKey: 'navigation.map', path: '/map', icon: <MapIcon /> },
  { titleKey: 'navigation.research', path: '/research', icon: <AnalyticsIcon /> },
  { titleKey: 'navigation.analytics', path: '/analytics', icon: <DashboardIcon /> }
];

const Header: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const { t } = useTypedTranslation();

  // Focus trap for mobile drawer
  const drawerFocusTrapRef = useFocusTrap(drawerOpen);

  // Build nav links with translations
  const navLinks: NavLink[] = navLinksConfig.map(link => ({
    ...link,
    ariaLabel: t(link.titleKey)
  }));

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // Enhanced keyboard navigation for drawer
  useKeyboardNavigation(
    () => setDrawerOpen(false), // Escape key closes drawer
    undefined, // Enter key
    undefined, // Arrow up
    undefined, // Arrow down
    undefined, // Arrow left
    undefined  // Arrow right
  );

  return (
    <AppBar 
      position="static" 
      color="primary" 
      component="nav" 
      role="navigation" 
      aria-label={t('navigation.mobileMenu')}
      id="navigation"
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          data-testid="site-title"
          aria-label={t('homepage.title')}
          sx={{ 
            flexGrow: 1, 
            color: 'white',
            textDecoration: 'none',
            fontWeight: 'bold',
            '&:focus': {
              outline: '2px solid white',
              outlineOffset: '2px',
              borderRadius: 1
            }
          }}
        >
          {t('homepage.title')}
        </Typography>

        {/* Accessibility Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <HighContrastToggle variant="icon" size="small" />
          <LanguageSwitcher variant="icon" size="small" />
        </Box>

        {isMobile ? (
          <>
            <IconButton
              edge="end"
              color="inherit"
              aria-label={t('accessibility.openMenu')}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              data-testid="mobile-menu-button"
              onClick={toggleDrawer(true)}
              sx={{
                '&:focus': {
                  outline: '2px solid white',
                  outlineOffset: '2px'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
              id="mobile-drawer"
              ModalProps={{
                'aria-labelledby': 'drawer-title',
                'aria-describedby': 'drawer-description'
              }}
            >
              <Box
                ref={drawerFocusTrapRef}
                sx={{ width: 280 }}
                role="presentation"
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2 
                }}>
                  <Typography 
                    variant="h6" 
                    id="drawer-title"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {t('navigation.mobileMenu')}
                  </Typography>
                  <IconButton 
                    onClick={toggleDrawer(false)}
                    aria-label={t('accessibility.closeMenu')}
                    sx={{
                      '&:focus': {
                        outline: '2px solid currentColor',
                        outlineOffset: '2px'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                <Divider />
                
                <List 
                  role="menu" 
                  aria-label={t('navigation.mobileMenu')}
                  sx={{ pt: 1 }}
                >
                  {navLinks.map(({ titleKey, path, icon, ariaLabel }) => (
                    <ListItem
                      component={RouterLink}
                      to={path}
                      key={titleKey}
                      role="menuitem"
                      aria-label={ariaLabel}
                      aria-current={pathname === path ? 'page' : undefined}
                      data-testid={`nav-link-${ariaLabel?.toLowerCase()}`}
                      onClick={toggleDrawer(false)}
                      sx={{
                        color: pathname === path ? 'primary.main' : 'text.primary',
                        backgroundColor: pathname === path ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                        fontWeight: pathname === path ? 'bold' : 'normal',
                        borderRadius: 1,
                        mx: 1,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        },
                        '&:focus': {
                          outline: '2px solid currentColor',
                          outlineOffset: '2px'
                        }
                      }}
                    >
                      <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                        {icon}
                      </Box>
                      <ListItemText 
                        primary={t(titleKey)} 
                        primaryTypographyProps={{
                          fontWeight: pathname === path ? 'bold' : 'normal'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ mt: 2 }} />
                
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <HighContrastToggle variant="switch" size="small" />
                  <LanguageSwitcher variant="button" size="small" />
                </Box>
              </Box>
            </Drawer>
          </>
        ) : (
          <Box 
            sx={{ display: 'flex', alignItems: 'center' }} 
            role="menubar" 
            aria-label={t('navigation.desktopNavigation')}
          >
            {navLinks.map(({ titleKey, path, ariaLabel }) => (
              <Button
                key={titleKey}
                component={RouterLink}
                to={path}
                color="inherit"
                role="menuitem"
                aria-label={ariaLabel}
                aria-current={pathname === path ? 'page' : undefined}
                data-testid={`nav-link-${ariaLabel?.toLowerCase()}`}
                sx={{
                  mx: 1,
                  fontWeight: pathname === path ? 'bold' : 'normal',
                  borderBottom: pathname === path ? '2px solid white' : 'none',
                  '&:focus': {
                    outline: '2px solid white',
                    outlineOffset: '2px',
                    borderRadius: 1
                  }
                }}
              >
                {t(titleKey)}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 