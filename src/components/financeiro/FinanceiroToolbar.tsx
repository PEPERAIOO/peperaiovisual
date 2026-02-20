import { useState } from 'react';
import {
  Box,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Category as CategoryIcon,
  DeleteSweep as TrashIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface FinanceiroToolbarProps {
  onNewTransaction: () => void;
  onOpenMonthSelector: () => void;
  onOpenCategoryManager: () => void;
  onOpenTrash: () => void;
  onExportPdf: () => void;
  currentMonthLabel: string;
  canEdit?: boolean; // Permissão para editar (mostrar botão Nova Transação)
}

const FinanceiroToolbar = ({
  onNewTransaction,
  onOpenMonthSelector,
  onOpenCategoryManager,
  onOpenTrash,
  onExportPdf,
  currentMonthLabel,
  canEdit = true,
}: FinanceiroToolbarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Ações do SpeedDial para mobile (filtradas por permissão)
  const speedDialActions = [
    ...(canEdit ? [{ 
      icon: <AddIcon />, 
      name: 'Nova Transação', 
      onClick: onNewTransaction,
      color: '#009246',
    }] : []),
    { 
      icon: <CalendarIcon />, 
      name: 'Mudar Mês', 
      onClick: onOpenMonthSelector,
      color: '#2196f3',
    },
    ...(canEdit ? [{ 
      icon: <CategoryIcon />, 
      name: 'Categorias', 
      onClick: onOpenCategoryManager,
      color: '#9c27b0',
    }] : []),
    { 
      icon: <PdfIcon />, 
      name: 'Relatório PDF', 
      onClick: onExportPdf,
      color: '#ff9800',
    },
    ...(canEdit ? [{ 
      icon: <TrashIcon />, 
      name: 'Lixeira', 
      onClick: onOpenTrash,
      color: '#ce2b37',
    }] : []),
  ];

  const handleSpeedDialAction = (action: () => void) => {
    setSpeedDialOpen(false);
    action();
  };

  const buttonSx = {
    borderRadius: 2,
    textTransform: 'none' as const,
    fontWeight: 500,
    px: 2.5,
    py: 1,
    fontSize: '0.85rem',
  };

  const secondaryButtonSx = {
    ...buttonSx,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  };

  // Mobile: Renderiza apenas o SpeedDial fixo
  if (isMobile) {
    return (
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
          ariaLabel="Ações Financeiro"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1200,
            '& .MuiSpeedDial-fab': {
              background: 'linear-gradient(135deg, #009246 0%, #007a38 100%)',
              boxShadow: '0 6px 20px rgba(0, 146, 70, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a850 0%, #008a42 100%)',
              },
            },
          }}
          icon={<SpeedDialIcon icon={<AddIcon />} openIcon={<CloseIcon />} />}
          open={speedDialOpen}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
          direction="up"
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={() => handleSpeedDialAction(action.onClick)}
              FabProps={{
                sx: {
                  backgroundColor: action.color,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: action.color,
                    filter: 'brightness(1.1)',
                  },
                },
              }}
              sx={{
                '& .MuiSpeedDialAction-staticTooltipLabel': {
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                },
              }}
            />
          ))}
        </SpeedDial>
      </>
    );
  }

  // Desktop: Toolbar tradicional
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 3,
        p: 2,
        backgroundColor: 'rgba(30, 30, 30, 0.4)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Botão Nova Transação - Destaque (apenas se canEdit) */}
      {canEdit && (
        <Tooltip title="Adicionar nova transação">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewTransaction}
            sx={{
              ...buttonSx,
              background: 'linear-gradient(135deg, #009246 0%, #007a38 100%)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(0, 146, 70, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a850 0%, #008a42 100%)',
                boxShadow: '0 6px 20px rgba(0, 146, 70, 0.4)',
              },
            }}
          >
            Nova Transação
          </Button>
        </Tooltip>
      )}

      {/* Botão Mudar Mês */}
      <Tooltip title={`Mês atual: ${currentMonthLabel}`}>
        <Button
          variant="outlined"
          startIcon={<CalendarIcon />}
          onClick={onOpenMonthSelector}
          sx={secondaryButtonSx}
        >
          Mudar Mês
        </Button>
      </Tooltip>

      {/* Botão Categorias (apenas se canEdit) */}
      {canEdit && (
        <Tooltip title="Gerenciar categorias">
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={onOpenCategoryManager}
            sx={secondaryButtonSx}
          >
            Categorias
          </Button>
        </Tooltip>
      )}

      {/* Espaçador flexível */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Botão Lixeira (apenas se canEdit) */}
      {canEdit && (
        <Tooltip title="Histórico de exclusões">
          <Button
            variant="outlined"
            startIcon={<TrashIcon />}
            onClick={onOpenTrash}
            sx={{
              ...secondaryButtonSx,
              '&:hover': {
                backgroundColor: 'rgba(206, 43, 55, 0.1)',
                borderColor: 'rgba(206, 43, 55, 0.3)',
                color: '#ce2b37',
              },
            }}
          >
            Lixeira
          </Button>
        </Tooltip>
      )}

      {/* Botão Exportar PDF */}
      <Tooltip title="Exportar relatório em PDF">
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={onExportPdf}
          sx={{
            ...secondaryButtonSx,
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              borderColor: 'rgba(33, 150, 243, 0.3)',
              color: '#2196f3',
            },
          }}
        >
          Relatório PDF
        </Button>
      </Tooltip>
    </Box>
  );
};

export default FinanceiroToolbar;
