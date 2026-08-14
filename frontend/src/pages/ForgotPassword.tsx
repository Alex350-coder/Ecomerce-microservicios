import { Link } from 'react-router-dom';
import { MainLayout } from '../templates/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import '../styles/pages/Checkout.css';

export const ForgotPassword = () => {
  return (
    <MainLayout>
      <div className="forgot-password-page">
        <h1>Recuperar Contraseña</h1>
        <Card className="empty-state">
          <p>
            Ingresa tu correo en la página de inicio de sesión para recibir instrucciones de
            recuperación.
          </p>
          <Link to="/login">
            <Button variant="primary">Ir a Iniciar Sesión</Button>
          </Link>
        </Card>
      </div>
    </MainLayout>
  );
};
