import '../../styles/ui/Spinner.css';

interface SpinnerProps {
  label?: string;
}

export const Spinner = ({ label = 'Cargando...' }: SpinnerProps) => (
  <div className="loading-spinner" role="status">
    <div className="spinner" aria-hidden="true" />
    <p>{label}</p>
  </div>
);
