import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Grid,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Componentes
import { EntityModal, EntidadeCard } from '../components/entidades';

// Hook e tipos
import { useEntidades } from '../hooks/useEntidades';
import {
  Entity,
  EntityType,
  EntityTabValue,
  ENTITY_TABS,
  ENTITY_TYPE_CONFIG,
} from '../types/entidades';

// Ícones para SpeedDial
const SPEED_DIAL_ACTIONS = [
  { icon: <PersonAddIcon />, name: 'Cliente', type: 'cliente' as EntityType },
  { icon: <EngineeringIcon />, name: 'Funcionário', type: 'funcionario' as EntityType },
  { icon: <LocalShippingIcon />, name: 'Fornecedor', type: 'fornecedor' as EntityType },
];

const MotionBox = motion.create(Box);

const Entidades = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // Hook principal
  const {
    entities,
    loading,
    error,
    addEntity,
    updateEntity,
    removeEntity,
    getFilteredEntities,
  } = useEntidades();

  // Estados
  const [activeTab, setActiveTab] = useState<EntityTabValue>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [presetType, setPresetType] = useState<EntityType | undefined>();

  // Entidades filtradas por tab e busca
  const filteredEntities = useMemo(() => {
    let result = getFilteredEntities(activeTab);
    
    // Filtro de busca por nome
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (entity) =>
          entity.nome.toLowerCase().includes(query) ||
          entity.email?.toLowerCase().includes(query) ||
          entity.telefone?.includes(query)
      );
    }
    
    return result;
  }, [getFilteredEntities, activeTab, searchQuery]);

  // Contadores por tipo
  const counters = useMemo(() => {
    return {
      todos: entities.length,
      cliente: entities.filter((e) => e.tipo === 'cliente').length,
      funcionario: entities.filter((e) => e.tipo === 'funcionario').length,
      fornecedor: entities.filter((e) => e.tipo === 'fornecedor').length,
      socio: entities.filter((e) => e.tipo === 'socio').length,
    };
  }, [entities]);

  // Handlers
  const handleOpenModal = useCallback((entity?: Entity, type?: EntityType) => {
    setEditingEntity(entity || null);
    setPresetType(type);
    setModalOpen(true);
    setSpeedDialOpen(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingEntity(null);
    setPresetType(undefined);
    setModalOpen(false);
  }, []);

  const handleSpeedDialAction = useCallback(
    (type: EntityType) => {
      handleOpenModal(undefined, type);
    },
    [handleOpenModal]
  );

  const handleDeleteEntity = useCallback(
    async (entity: Entity) => {
      if (!window.confirm(`Deseja apagar "${entity.nome}"?`)) return;

      const result = await removeEntity(entity.id);
      if (!result.success) {
        alert(
          'Não foi possível apagar. Verifique se este cadastro possui vínculos (obras/transações) e tente novamente.'
        );
      }
    },
    [removeEntity]
  );

  // Loading state
  if (loading && entities.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <CircularProgress sx={{ color: '#009246' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ mb: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f5f5f5 0%, rgba(255,255,255,0.7) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
                mb: 0.5,
              }}
            >
              Equipe
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.9rem',
              }}
            >
              {entities.length} {entities.length === 1 ? 'contato' : 'contatos'} cadastrados
            </Typography>
          </Box>

          {/* Botão Desktop */}
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
              sx={{
                background: 'linear-gradient(135deg, #009246 0%, #00a651 100%)',
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #007a3a 0%, #009246 100%)',
                },
              }}
            >
              Novo Cadastro
            </Button>
          )}
        </Box>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabs de Filtro */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            mb: 2,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant={isSmall ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                fontWeight: 500,
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#009246',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#009246',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            {ENTITY_TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Box
                      component="span"
                      sx={{
                        backgroundColor:
                          activeTab === tab.value
                            ? 'rgba(0, 146, 70, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color: activeTab === tab.value ? '#009246' : 'rgba(255, 255, 255, 0.5)',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {counters[tab.value]}
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Barra de Pesquisa */}
        <TextField
          fullWidth
          placeholder="Buscar por nome, email ou telefone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.08)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.15)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#009246',
              },
            },
            '& .MuiInputBase-input': {
              color: '#f5f5f5',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.4)',
                opacity: 1,
              },
            },
          }}
        />
      </MotionBox>

      {/* Grid de Cards */}
      <AnimatePresence mode="wait">
        {filteredEntities.length === 0 ? (
          <Fade in>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <BusinessIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {searchQuery
                  ? 'Nenhum resultado encontrado'
                  : 'Nenhum cadastro encontrado'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {searchQuery
                  ? 'Tente buscar por outro termo'
                  : 'Adicione seu primeiro contato clicando no botão +'}
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Grid container spacing={2}>
            {filteredEntities.map((entidade, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }}
                key={entidade.id}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <EntidadeCard entidade={entidade} onDelete={handleDeleteEntity} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </AnimatePresence>

      {/* SpeedDial para Mobile */}
      {isMobile && (
        <>
          <Backdrop
            open={speedDialOpen}
            onClick={() => setSpeedDialOpen(false)}
            sx={{
              zIndex: 1100,
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          />
          <SpeedDial
            ariaLabel="Adicionar cadastro"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1200,
              '& .MuiSpeedDial-fab': {
                background: 'linear-gradient(135deg, #009246 0%, #00a651 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #007a3a 0%, #009246 100%)',
                },
              },
            }}
            icon={<SpeedDialIcon />}
            onClose={() => setSpeedDialOpen(false)}
            onOpen={() => setSpeedDialOpen(true)}
            open={speedDialOpen}
          >
            {SPEED_DIAL_ACTIONS.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                tooltipOpen
                onClick={() => handleSpeedDialAction(action.type)}
                sx={{
                  '& .MuiSpeedDialAction-staticTooltipLabel': {
                    backgroundColor: ENTITY_TYPE_CONFIG[action.type].bgColor,
                    color: ENTITY_TYPE_CONFIG[action.type].textColor,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            ))}
          </SpeedDial>
        </>
      )}

      {/* Modal de Edição/Criação */}
      <EntityModal
        open={modalOpen}
        onClose={handleCloseModal}
        entity={editingEntity}
        onSave={addEntity}
        onUpdate={updateEntity}
        presetType={presetType}
      />
    </Box>
  );
};

export default Entidades;
