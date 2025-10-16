import React, { useState } from 'react';
import { AuthLayout } from '../templates/AuthLayout';  
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import '../styles/pages/Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('Login attempt:', { email, password });
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <AuthLayout>  {/* ← Usar AuthLayout en lugar de MainLayout */}
      <Card className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">E</div>
            <h2>ElectroShop</h2>
          </div>
          <h1>Iniciar Sesión</h1>
          <p>Accede a tu cuenta para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="password-options">
            <label className="show-password">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              Mostrar contraseña
            </label>
            
            <a href="/forgot-password" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <Button 
            type="submit" 
            className="login-button"
            isLoading={isLoading}
          >
            Iniciar Sesión
          </Button>
        </form>

        <div className="login-footer">
          <p>¿No tienes una cuenta?  <Link to="/register">Regístrate aquí</Link></p>
        </div>
      </Card>
    </AuthLayout>
  );
};