import React from 'react';
import { Header } from '../components/layout/Header';  
import { Footer } from '../components/layout/Footer';
import '../styles/templates/MainLayout.css';

export const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Header />  
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};