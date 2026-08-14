import React, { useState } from 'react';
import { AuthLayout } from '../templates/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient, ApiError } from '../api/client';
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
  const { login } = useAuth();

  // Mostrar mensaje de éxito si viene del registro
  const successMessage = location.state?.message;

  const getErrorMessage = (err) => {
    if (err instanceof ApiError) {
      if (err.statusCode === 401) return 'Credenciales inválidas. Verifica tu email y contraseña.';
      if (err.statusCode === 423) return 'Cuenta bloqueada. Contacta al administrador.';
    }
    return err?.message || 'Error de conexión. Intenta nuevamente.';
  };

  // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      setSuccess('Si el email existe, se enviarán instrucciones de recuperación');
      setShowForgotPassword(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // RESTABLECER CONTRASEÑA CON TOKEN
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      setSuccess('Contraseña restablecida correctamente. Ahora puedes iniciar sesión.');
      setShowResetPassword(false);
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? 'Token inválido o expirado' : getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // INICIAR SESIÓN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = await login(email, password);

      if (!user.emailVerified) {
        setSuccess('¡Bienvenido! Tu email no está verificado. Te recomendamos verificarlo.');
      }

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
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
