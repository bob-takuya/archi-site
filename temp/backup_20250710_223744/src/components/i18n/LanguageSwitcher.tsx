import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { useTypedTranslation, supportedLanguages, SupportedLanguage } from '../../i18n';

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Language Switcher Component
 * Provides accessible language switching with keyboard navigation
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'button',
  size = 'medium',
  className = ''
}) => {
  const { t, changeLanguage, currentLanguage } = useTypedTranslation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      handleClose();
      
      // Announce language change to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.textContent = `Language changed to ${
        supportedLanguages.find(lang => lang.code === language)?.nativeName
      }`;
      
      document.body.appendChild(announcement);
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };
  
  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);
  
  if (variant === 'icon') {
    return (
      <Box className={className}>
        <Button
          size={size}
          onClick={handleClick}
          startIcon={<LanguageIcon />}
          aria-label={t('languages.changeLanguage')}
          aria-expanded={Boolean(anchorEl)}
          aria-haspopup="menu"
          sx={{
            minWidth: 'auto',
            px: 1,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          {currentLang?.code.toUpperCase()}
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'language-button',
            role: 'menu'
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          sx={{
            '& .MuiPaper-root': {
              minWidth: 160,
              mt: 1,
              borderRadius: 2,
              boxShadow: theme.shadows[3]
            }
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === currentLanguage}
              role="menuitemradio"
              aria-checked={language.code === currentLanguage}
              sx={{
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.16)
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {language.code === currentLanguage && (
                  <CheckIcon 
                    fontSize="small" 
                    color="primary"
                    aria-hidden="true"
                  />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={language.nativeName}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: language.code === currentLanguage ? 600 : 400
                }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }
  
  return (
    <Box className={className}>
      <Button
        size={size}
        variant="outlined"
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        aria-label={t('languages.changeLanguage')}
        aria-expanded={Boolean(anchorEl)}
        aria-haspopup="menu"
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          px: 2,
          py: 1,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.04)
          }
        }}
      >
        {currentLang?.nativeName}
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
          role: 'menu'
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            mt: 1,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            border: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
            role="menuitemradio"
            aria-checked={language.code === currentLanguage}
            sx={{
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.16)
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {language.code === currentLanguage && (
                <CheckIcon 
                  fontSize="small" 
                  color="primary"
                  aria-hidden="true"
                />
              )}
            </ListItemIcon>
            <ListItemText>
              <Box>
                <Box 
                  component="span" 
                  sx={{ 
                    fontWeight: language.code === currentLanguage ? 600 : 400,
                    fontSize: '0.875rem'
                  }}
                >
                  {language.nativeName}
                </Box>
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mt: 0.25
                  }}
                >
                  {language.name}
                </Box>
              </Box>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};