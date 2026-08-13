import React, { useState } from 'react';
import { AuthLayout } from '../templates/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mostrar mensaje de éxito si viene del registro
  const successMessage = location.state?.message;

  // 🆕 SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3002/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar recuperación');
      }

      setSuccess('Si el email existe, se enviarán instrucciones de recuperación');
      setShowForgotPassword(false);

      // 🆕 Mostrar instrucciones para usar el token (en desarrollo)
      console.log('En producción se enviaría un email. Token de desarrollo:', data.debugToken);
    } catch (error) {
      console.error('Error en recuperación:', error);
      setError(error.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 RESTABLECER CONTRASEÑA CON TOKEN
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3002/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al restablecer contraseña');
      }

      setSuccess('Contraseña restablecida correctamente. Ahora puedes iniciar sesión.');
      setShowResetPassword(false);
      setResetToken('');
      setNewPassword('');
    } catch (error) {
      console.error('Error en restablecimiento:', error);
      setError(error.message || 'Token inválido o expirado');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 INICIAR SESIÓN MEJORADO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3002/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 🆕 Manejo específico de errores
        if (response.status === 401) {
          if (data.message?.includes('bloqueada')) {
            setError(
              'Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta en 15 minutos.',
            );
          } else {
            setError('Credenciales inválidas. Verifica tu email y contraseña.');
          }
        } else if (response.status === 423) {
          setError('Cuenta bloqueada. Contacta al administrador.');
        } else {
          throw new Error(data.message || 'Error en el inicio de sesión');
        }
        setIsLoading(false);
        return;
      }

      // 🆕 Login exitoso - mejorado
      console.log('Login exitoso:', data);

      // Guardar token y datos de usuario
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 🆕 Verificar si el email está verificado
      if (!data.user.emailVerified) {
        setSuccess('¡Bienvenido! Tu email no está verificado. Te recomendamos verificarlo.');
      }

      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 CERRAR MODALES
  const closeModals = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setForgotPasswordEmail('');
    setResetToken('');
    setNewPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <AuthLayout>
      <Card className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">E</div>
            <h2>ElectroShop</h2>
          </div>
          <h1>Iniciar Sesión</h1>
          <p>Accede a tu cuenta para continuar</p>
        </div>

        {/* 🆕 MENSAJES DE ÉXITO/ERROR */}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {success && <div className="success-message">{success}</div>}

        {error && (
          <div className="error-message">
            {error}
            {error.includes('bloqueada') && (
              <div className="error-actions">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>
        )}

        {/* 🆕 FORMULARIO DE LOGIN PRINCIPAL */}
        {!showForgotPassword && !showResetPassword && (
          <form className="login-form" onSubmit={handleSubmit}>
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <div className="password-options">
              <label className="show-password">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                />
                Mostrar contraseña
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              className="login-button"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        )}

        {/* 🆕 FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA */}
        {showForgotPassword && (
          <div className="recovery-form">
            <h3>Recuperar Contraseña</h3>
            <p>Ingresa tu email y te enviaremos instrucciones de recuperación</p>

            <form onSubmit={handleForgotPassword}>
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="tu@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                disabled={isLoading}
              />

              <div className="recovery-actions">
                <Button
                  type="submit"
                  className="recovery-button"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                </Button>

                <button
                  type="button"
                  className="back-button"
                  onClick={closeModals}
                  disabled={isLoading}
                >
                  Volver al Login
                </button>

                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowResetPassword(true);
                  }}
                >
                  Ya tengo un token de recuperación
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🆕 FORMULARIO DE RESTABLECIMIENTO DE CONTRASEÑA */}
        {showResetPassword && (
          <div className="reset-form">
            <h3>Restablecer Contraseña</h3>
            <p>Ingresa el token que recibiste y tu nueva contraseña</p>

            <form onSubmit={handleResetPassword}>
              <Input
                label="Token de Recuperación"
                type="text"
                placeholder="Ingresa el token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                disabled={isLoading}
              />

              <Input
                label="Nueva Contraseña"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />

              <div className="reset-actions">
                <Button
                  type="submit"
                  className="reset-button"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </Button>

                <button
                  type="button"
                  className="back-button"
                  onClick={closeModals}
                  disabled={isLoading}
                >
                  Volver al Login
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="login-footer">
          <p>
            ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
