import React from 'react';
import { Header } from '../components/layout/Header';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import '../styles/MainLayout.css';

export const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Header />
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};