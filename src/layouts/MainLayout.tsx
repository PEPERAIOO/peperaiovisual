import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  useMediaQuery,
  useTheme,
  Badge,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Construction as ConstructionIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon,
  CreditCard as CreditCardIcon,
  CalendarMonth as CalendarMonthIcon,
  Engineering as EngineeringIcon,
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  StickyNote2 as StickyNote2Icon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCenter } from '../components/notifications';

// Largura do Drawer
const drawerWidth = 260;

// Transição suave para AppBar e Main
const transitionMixin = {
  transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1), width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
};

// Barra decorativa da Itália no topo da Sidebar
const ItalyAccent = styled(Box)({
  height: 4,
  width: '100%',
  background: 'linear-gradient(90deg, #009246 33.33%, #f5f5f5 33.33%, #f5f5f5 66.66%, #ce2b37 66.66%)',
});

// Cabeçalho do Drawer com botão de fechar
const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  minHeight: 64,
}));

// Menu items configuration
interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiresAdmin?: boolean; // Requer role admin
  hideForAdmin?: boolean;  // Ocultar para admin (ex: Minhas Obras)
}

// Itens base do menu (filtrados dinamicamente baseado em permissões)
const baseMenuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Propostas', icon: <DescriptionIcon />, path: '/propostas' },
  { text: 'Formação de Preço', icon: <CalculateIcon />, path: '/formacao-preco' },
  { text: 'Obras', icon: <ConstructionIcon />, path: '/obras' },
  { text: 'Gestão de Obras', icon: <EngineeringIcon />, path: '/gestao-obras', requiresAdmin: true },
  { text: 'Minhas Obras', icon: <AssignmentIcon />, path: '/minhas-obras', hideForAdmin: true },
  { text: 'Financeiro', icon: <AccountBalanceIcon />, path: '/financeiro' },
  { text: 'Dívidas', icon: <CreditCardIcon />, path: '/dividas' },
  { text: 'Calendário', icon: <CalendarMonthIcon />, path: '/calendario' },
  { text: 'Anotações', icon: <StickyNote2Icon />, path: '/anotacoes' },
  { text: 'Pessoas & Empresas', icon: <PeopleIcon />, path: '/entidades' },
];

const MainLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Autenticação e permissões
  const { signOut, profile } = useAuth();
  const { isAdmin, canDelegate } = usePermissions();
  const { stats } = useNotifications();

  // Estado do menu: aberto por padrão no Desktop, fechado no Mobile
  const [open, setOpen] = useState(!isMobile);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Filtrar itens do menu baseado nas permissões
  const menuItems = baseMenuItems.filter((item) => {
    // Se requer admin e usuário não é admin, oculta
    if (item.requiresAdmin && !canDelegate()) {
      return false;
    }
    // Se deve ocultar para admin e usuário é admin, oculta
    if (item.hideForAdmin && isAdmin()) {
      return false;
    }
    return true;
  });

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Fecha o drawer no mobile após navegação
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Conteúdo do Drawer (compartilhado entre mobile e desktop)
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ItalyAccent />

      {/* Logo Area com botão de fechar */}
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #009246 0%, #007a38 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: '#fff',
            }}
          >
            P
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #009246 0%, #00c853 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Peperaio
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.65rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              ERP V2
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': { color: '#009246', backgroundColor: 'rgba(0, 146, 70, 0.1)' },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  px: 2,
                  backgroundColor: isActive ? 'rgba(0, 146, 70, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #009246' : '3px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(0, 146, 70, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#009246' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#f5f5f5' : 'rgba(255, 255, 255, 0.7)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Bottom Section - Settings & Logout */}
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            sx={{
              borderRadius: 2,
              minHeight: 44,
              px: 2,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Configurações"
              primaryTypographyProps={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              minHeight: 44,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(206, 43, 55, 0.1)',
                '& .MuiListItemIcon-root': { color: '#ce2b37' },
                '& .MuiListItemText-primary': { color: '#ce2b37' },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sair"
              primaryTypographyProps={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      {/* User Profile */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Botão de Configurações */}
        <ListItemButton
          onClick={() => handleNavigation('/configuracoes')}
          sx={{
            borderRadius: 2,
            mb: 1.5,
            backgroundColor: location.pathname === '/configuracoes' ? 'rgba(33, 150, 243, 0.15)' : 'transparent',
            '&:hover': {
              backgroundColor: location.pathname === '/configuracoes' ? 'rgba(33, 150, 243, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: location.pathname === '/configuracoes' ? '#2196f3' : 'rgba(255, 255, 255, 0.5)' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Configurações" 
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: location.pathname === '/configuracoes' ? 600 : 400,
              color: location.pathname === '/configuracoes' ? '#2196f3' : 'rgba(255, 255, 255, 0.7)',
            }}
          />
        </ListItemButton>

        {/* Perfil do usuário */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            src={profile?.avatar_url}
            sx={{
              width: 36,
              height: 36,
              backgroundColor: 'rgba(0, 146, 70, 0.2)',
              color: '#009246',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {profile?.nome?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: '#f5f5f5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {profile?.nome || 'Usuário'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.7rem',
              }}
            >
              {profile?.role === 'admin' ? 'Administrador' : 
               profile?.role === 'socio_executor' ? 'Sócio' : 
               profile?.role === 'user' ? 'Usuário' : 'Visualizador'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': { color: '#ce2b37', backgroundColor: 'rgba(206, 43, 55, 0.1)' },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar - Fixa no topo com transição suave */}
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'none',
          ...transitionMixin,
          // Quando aberto no Desktop: encolhe para dar espaço ao Drawer
          ...(open && !isMobile && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
          }),
          // Quando fechado ou Mobile: ocupa 100%
          ...(!open || isMobile) && {
            width: '100%',
            marginLeft: 0,
          },
        }}
      >
        <Toolbar>
          {/* Botão de menu - sempre visível */}
          <IconButton
            color="inherit"
            aria-label="alternar menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1rem',
            }}
          >
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          {/* Botão de Notificações */}
          <Tooltip title="Notificações">
            <IconButton
              color="inherit"
              onClick={() => setNotificationsOpen(true)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#009246',
                  backgroundColor: 'rgba(0, 146, 70, 0.1)',
                },
              }}
            >
              <Badge
                badgeContent={stats.naoLidas}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    minWidth: 18,
                    height: 18,
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navegação - Container dos Drawers */}
      <Box
        component="nav"
        sx={{
          width: { md: open ? drawerWidth : 0 },
          flexShrink: { md: 0 },
          ...transitionMixin,
        }}
        aria-label="menu de navegação"
      >
        {/* Drawer Mobile - Temporário (overlay) */}
        <Drawer
          variant="temporary"
          open={isMobile && open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Melhor performance em mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'rgba(18, 18, 18, 0.98)',
              backdropFilter: 'blur(12px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Drawer Desktop - Persistente (empurra o conteúdo) */}
        <Drawer
          variant="persistent"
          open={!isMobile && open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'rgba(18, 18, 18, 0.98)',
              backdropFilter: 'blur(12px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: '100%',
          overflowX: 'hidden',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, rgba(25, 25, 25, 1) 0%, rgba(12, 12, 12, 1) 100%)',
          ...transitionMixin,
          // Quando aberto no Desktop: adiciona margin para o Drawer
          ...(open && !isMobile && {
            marginLeft: 0,
            width: `calc(100% - ${drawerWidth}px)`,
          }),
        }}
      >
        {/* Toolbar espaçador - compensa a altura da AppBar fixa */}
        <Toolbar />

        {/* Conteúdo das rotas filhas */}
        <Outlet />
      </Box>

      {/* Drawer de Notificações */}
      <NotificationCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </Box>
  );
};

export default MainLayout;
