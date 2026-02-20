import { createTheme } from '@mui/material/styles';

// Cores da bandeira da Itália
const italyGreen = '#009246';
const italyWhite = '#f5f5f5';
const italyRed = '#ce2b37';

// Cores do tema dark
const darkBackground = '#121212';
const paperBackground = '#1e1e1e';

const peperaioTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: italyGreen,
      light: '#4caf50',
      dark: '#006400',
      contrastText: italyWhite,
    },
    secondary: {
      main: italyRed,
      light: '#ff5252',
      dark: '#8b0000',
      contrastText: italyWhite,
    },
    error: {
      main: italyRed,
      light: '#ff5252',
      dark: '#8b0000',
    },
    background: {
      default: darkBackground,
      paper: paperBackground,
    },
    text: {
      primary: italyWhite,
      secondary: 'rgba(245, 245, 245, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 146, 70, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: italyGreen,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${italyGreen} ${darkBackground}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: italyGreen,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: darkBackground,
          },
        },
      },
    },
  },
});

export default peperaioTheme;
