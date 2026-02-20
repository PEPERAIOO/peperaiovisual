import { useState, FormEvent } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import supabase from '../lib/supabaseClient';

// Animação de pulso suave para o glow
const pulseGlow = keyframes`
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.15;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.2;
  }
`;

// Animação de brilho do botão (reservado para uso futuro)
// keyframes para shimmer effect disponível se necessário

// Barra decorativa com as cores da bandeira da Itália
const ItalyStripe = styled(Box)({
  height: 6,
  width: '100%',
  background: 'linear-gradient(90deg, #009246 33.33%, #f5f5f5 33.33%, #f5f5f5 66.66%, #ce2b37 66.66%)',
  borderRadius: '12px 12px 0 0',
});

// Container principal com gradiente radial cinematográfico
const LoginContainer = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  position: 'relative',
  overflow: 'hidden',
  background: `
    radial-gradient(ellipse at center, rgba(30, 30, 30, 1) 0%, rgba(12, 12, 12, 1) 50%, rgba(5, 5, 5, 1) 100%)
  `,
});

// Elemento de Glow verde difuso atrás do card
const GlowOrb = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  height: 500,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(0, 146, 70, 0.25) 0%, rgba(0, 146, 70, 0) 70%)',
  filter: 'blur(60px)',
  pointerEvents: 'none',
  animation: `${pulseGlow} 4s ease-in-out infinite`,
});

// Segundo glow mais sutil (vermelho) para profundidade
const GlowOrbSecondary = styled(Box)({
  position: 'absolute',
  top: '60%',
  left: '60%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  height: 300,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(206, 43, 55, 0.1) 0%, rgba(206, 43, 55, 0) 70%)',
  filter: 'blur(80px)',
  pointerEvents: 'none',
});

// Card do login com Glassmorphism
const LoginCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 420,
  overflow: 'hidden',
  position: 'relative',
  zIndex: 1,
  // Glassmorphism
  background: 'rgba(25, 25, 25, 0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
  borderRadius: 16,
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    margin: '0 8px',
  },
}));

// Conteúdo interno do card
const CardContent = styled(Box)({
  padding: '32px 36px 36px',
});

// Estilos comuns para TextField com correção de autofill
const textFieldSx = {
  mb: 2.5,
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  // Correção do autofill do Chrome
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitBoxShadow: '0 0 0 100px rgba(25, 25, 25, 1) inset !important',
    WebkitTextFillColor: '#f5f5f5 !important',
    caretColor: '#f5f5f5',
    borderRadius: 'inherit',
    transition: 'background-color 5000s ease-in-out 0s',
  },
};

// Botão estilizado com gradiente e efeito shimmer
const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #009246 0%, #00a650 50%, #009246 100%)',
  backgroundSize: '200% auto',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    backgroundPosition: 'right center',
    boxShadow: '0 6px 20px rgba(0, 146, 70, 0.4)',
    transform: 'translateY(-2px)',
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    background: 'rgba(255, 255, 255, 0.12)',
  },
});

// Motion variants para animação do card
const cardVariants = {
  hidden: {
    y: 60,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
      duration: 0.8,
    },
  },
};

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const Login = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'success'>('error');
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
    
    if (alertMessage) {
      setAlertMessage(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAlertMessage(null);
    setDebugMessage(null);

    try {
      const email = formData.email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        // Log completo no console para diagnóstico
        console.error('Erro no login (Supabase):', error);

        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage =
            'E-mail ou senha incorretos. ' +
            'Se esse usuário foi criado via Google/convite e nunca definiu senha, ' +
            'use "Reset password" no Supabase para criar uma senha e então tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
        }
        
        setAlertSeverity('error');
        setAlertMessage(errorMessage);

        // Mostrar detalhes técnicos somente em DEV
        if (import.meta.env.DEV) {
          const errAny = error as unknown as {
            status?: number;
            code?: string;
            name?: string;
            message?: string;
          };

          setDebugMessage(
            `debug: status=${errAny.status ?? 'n/a'} code=${errAny.code ?? 'n/a'} name=${errAny.name ?? 'n/a'} msg=${errAny.message ?? ''}`
          );
        }
      } else {
        setAlertSeverity('success');
        setAlertMessage('Login realizado com sucesso! Redirecionando...');
      }
    } catch {
      setAlertSeverity('error');
      setAlertMessage('Erro de conexão. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <LoginContainer>
      {/* Background Glows */}
      <GlowOrb />
      <GlowOrbSecondary />
      
      {/* Card com animação */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', maxWidth: 420, zIndex: 1 }}
      >
        <LoginCard elevation={0}>
          <ItalyStripe />
          
          <CardContent>
            {/* Logo e Título */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #009246 0%, #00c853 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                  letterSpacing: '-0.5px',
                }}
              >
                Peperaio
              </Typography>
              <Typography
                variant="body2"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: 400,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                }}
              >
                Sistema ERP • V2
              </Typography>
            </Box>

            {/* Alerta de erro/sucesso */}
            {alertMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  severity={alertSeverity}
                  sx={{ 
                    mb: 3,
                    backgroundColor: alertSeverity === 'error' 
                      ? 'rgba(206, 43, 55, 0.15)' 
                      : 'rgba(0, 146, 70, 0.15)',
                    border: `1px solid ${alertSeverity === 'error' ? 'rgba(206, 43, 55, 0.3)' : 'rgba(0, 146, 70, 0.3)'}`,
                    '& .MuiAlert-icon': {
                      color: alertSeverity === 'error' ? '#ce2b37' : '#009246',
                    },
                  }}
                  onClose={() => setAlertMessage(null)}
                >
                  {alertMessage}
                  {debugMessage && (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', mt: 1, color: 'rgba(255, 255, 255, 0.65)' }}
                    >
                      {debugMessage}
                    </Typography>
                  )}
                </Alert>
              </motion.div>
            )}

            {/* Formulário */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                id="email"
                label="E-mail"
                type="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />

              <TextField
                fullWidth
                id="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={togglePasswordVisibility}
                        edge="end"
                        disabled={isLoading}
                        size="small"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.4)',
                          '&:hover': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ ...textFieldSx, mb: 3.5 }}
              />

              <GradientButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.6,
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                {isLoading ? (
                  <CircularProgress
                    size={24}
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  />
                ) : (
                  'Entrar'
                )}
              </GradientButton>
            </Box>

            {/* Links auxiliares */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: '#009246',
                  },
                }}
              >
                Esqueceu sua senha?
              </Typography>
            </Box>

            {/* Footer */}
            <Box 
              sx={{ 
                textAlign: 'center', 
                mt: 4, 
                pt: 3, 
                borderTop: '1px solid rgba(255, 255, 255, 0.06)' 
              }}
            >
              <Typography
                variant="caption"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                }}
              >
                © 2025 Peperaio V2 • Todos os direitos reservados
              </Typography>
            </Box>
          </CardContent>
        </LoginCard>
      </motion.div>
    </LoginContainer>
  );
};

export default Login;
