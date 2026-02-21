import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  Divider,
  Avatar,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts';
import supabase from '../lib/supabaseClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} style={{ paddingTop: 24 }}>
    {value === index && children}
  </div>
);

const Configuracoes = () => {
  const { profile, refreshProfile } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Dados do Perfil
  const [perfilData, setPerfilData] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    avatar_url: '',
  });

  // Dados da Empresa
  const [empresaData, setEmpresaData] = useState({
    nome_empresa: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    logo_url: '',
  });

  // Preferências
  const [preferencias, setPreferencias] = useState({
    notificacoes_email: true,
    notificacoes_sistema: true,
    tema: 'escuro' as 'escuro' | 'claro',
    idioma: 'pt-BR' as 'pt-BR' | 'en',
    formato_moeda: 'BRL' as 'BRL' | 'USD',
    formato_data: 'DD/MM/YYYY' as 'DD/MM/YYYY' | 'MM/DD/YYYY',
  });

  // Carregar dados do perfil
  useEffect(() => {
    if (profile) {
      setPerfilData({
        nome_completo: profile.nome || '',
        email: profile.email || '',
        telefone: '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  // Carregar dados da empresa
  useEffect(() => {
    const loadEmpresaData = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_empresa')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setEmpresaData({
            nome_empresa: data.nome_empresa || '',
            cnpj: data.cnpj || '',
            telefone: data.telefone || '',
            email: data.email || '',
            endereco: data.endereco || '',
            logo_url: data.logo_url || '',
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados da empresa:', err);
      }
    };

    loadEmpresaData();
  }, []);

  // Salvar Perfil
  const handleSavePerfil = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (!profile?.id) throw new Error('Usuário não identificado');

      const { error } = await supabase
        .from('profiles')
        .update({
          nome_completo: perfilData.nome_completo,
          avatar_url: perfilData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setSuccessMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMessage('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Empresa
  const handleSaveEmpresa = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Verificar se já existe registro
      const { data: existing } = await supabase
        .from('configuracoes_empresa')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from('configuracoes_empresa')
          .update({
            ...empresaData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase
          .from('configuracoes_empresa')
          .insert([empresaData]);

        if (error) throw error;
      }

      setSuccessMessage('Dados da empresa salvos com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar empresa:', err);
      setErrorMessage('Erro ao salvar dados da empresa.');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Preferências
  const handleSavePreferencias = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (!profile?.id) throw new Error('Usuário não identificado');

      // Verificar se já existe registro
      const { data: existing } = await supabase
        .from('configuracoes_usuario')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from('configuracoes_usuario')
          .update({
            ...preferencias,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase
          .from('configuracoes_usuario')
          .insert([{
            user_id: profile.id,
            ...preferencias,
          }]);

        if (error) throw error;
      }

      setSuccessMessage('Preferências salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      setErrorMessage('Erro ao salvar preferências.');
    } finally {
      setSaving(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#009246' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
    '& .MuiInputBase-input': { color: '#f5f5f5' },
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2196f3, #64b5f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ⚙️ Configurações
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Gerencie suas preferências e informações do sistema
          </Typography>
        </Box>
      </motion.div>

      {/* Mensagens */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'none',
              fontWeight: 600,
              '&.Mui-selected': { color: '#2196f3' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#2196f3' },
          }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Perfil" />
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Empresa" />
          <Tab icon={<PaletteIcon />} iconPosition="start" label="Preferências" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab Perfil */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
              {/* Avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={perfilData.avatar_url}
                  sx={{ width: 80, height: 80, bgcolor: '#2196f3', fontSize: '2rem' }}
                >
                  {perfilData.nome_completo?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: '#f5f5f5', fontWeight: 700 }}>
                    {perfilData.nome_completo || 'Nome do Usuário'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

              <TextField
                fullWidth
                label="Nome Completo"
                value={perfilData.nome_completo}
                onChange={(e) => setPerfilData({ ...perfilData, nome_completo: e.target.value })}
                sx={inputSx}
              />

              <TextField
                fullWidth
                label="E-mail"
                value={perfilData.email}
                disabled
                helperText="O e-mail não pode ser alterado"
                sx={inputSx}
              />

              <TextField
                fullWidth
                label="URL do Avatar"
                value={perfilData.avatar_url}
                onChange={(e) => setPerfilData({ ...perfilData, avatar_url: e.target.value })}
                placeholder="https://..."
                sx={inputSx}
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePerfil}
                disabled={saving}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': { bgcolor: '#1976d2' },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Perfil'}
              </Button>
            </Box>
          </TabPanel>

          {/* Tab Empresa */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
              <TextField
                fullWidth
                label="Nome da Empresa"
                value={empresaData.nome_empresa}
                onChange={(e) => setEmpresaData({ ...empresaData, nome_empresa: e.target.value })}
                sx={inputSx}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="CNPJ"
                  value={empresaData.cnpj}
                  onChange={(e) => setEmpresaData({ ...empresaData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  sx={inputSx}
                />
                <TextField
                  fullWidth
                  label="Telefone"
                  value={empresaData.telefone}
                  onChange={(e) => setEmpresaData({ ...empresaData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  sx={inputSx}
                />
              </Box>

              <TextField
                fullWidth
                label="E-mail Empresarial"
                value={empresaData.email}
                onChange={(e) => setEmpresaData({ ...empresaData, email: e.target.value })}
                type="email"
                sx={inputSx}
              />

              <TextField
                fullWidth
                label="Endereço"
                value={empresaData.endereco}
                onChange={(e) => setEmpresaData({ ...empresaData, endereco: e.target.value })}
                multiline
                rows={2}
                sx={inputSx}
              />

              <TextField
                fullWidth
                label="URL da Logo"
                value={empresaData.logo_url}
                onChange={(e) => setEmpresaData({ ...empresaData, logo_url: e.target.value })}
                placeholder="https://..."
                sx={inputSx}
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveEmpresa}
                disabled={saving}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': { bgcolor: '#1976d2' },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Dados da Empresa'}
              </Button>
            </Box>
          </TabPanel>

          {/* Tab Preferências */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
              {/* Notificações */}
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <NotificationsIcon sx={{ color: '#2196f3' }} />
                    <Typography variant="h6" sx={{ color: '#f5f5f5', fontWeight: 700 }}>
                      Notificações
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferencias.notificacoes_email}
                        onChange={(e) => setPreferencias({ ...preferencias, notificacoes_email: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#2196f3' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2196f3' },
                        }}
                      />
                    }
                    label="Notificações por E-mail"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferencias.notificacoes_sistema}
                        onChange={(e) => setPreferencias({ ...preferencias, notificacoes_sistema: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#2196f3' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2196f3' },
                        }}
                      />
                    }
                    label="Notificações do Sistema"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  />
                </CardContent>
              </Card>

              {/* Aparência e Região */}
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LanguageIcon sx={{ color: '#2196f3' }} />
                    <Typography variant="h6" sx={{ color: '#f5f5f5', fontWeight: 700 }}>
                      Regionalização
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      select
                      fullWidth
                      label="Idioma"
                      value={preferencias.idioma}
                      onChange={(e) => setPreferencias({ ...preferencias, idioma: e.target.value as any })}
                      sx={inputSx}
                    >
                      <MenuItem value="pt-BR">Português (Brasil)</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Formato de Moeda"
                      value={preferencias.formato_moeda}
                      onChange={(e) => setPreferencias({ ...preferencias, formato_moeda: e.target.value as any })}
                      sx={inputSx}
                    >
                      <MenuItem value="BRL">Real (R$)</MenuItem>
                      <MenuItem value="USD">Dólar ($)</MenuItem>
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Formato de Data"
                      value={preferencias.formato_data}
                      onChange={(e) => setPreferencias({ ...preferencias, formato_data: e.target.value as any })}
                      sx={inputSx}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/AAAA</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/AAAA</MenuItem>
                    </TextField>
                  </Box>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePreferencias}
                disabled={saving}
                sx={{
                  bgcolor: '#2196f3',
                  '&:hover': { bgcolor: '#1976d2' },
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default Configuracoes;
