import React from 'react'
import Navbar from './components/Navbar.jsx'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import { useThemeStore } from './store/useThemeStore.js'
import {Toaster} from 'react-hot-toast';
import Hero from './pages/Hero.jsx'
import FlashSale from './pages/FlashSale.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const {theme} = useThemeStore();
  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme={theme}>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Hero/>}></Route>
        <Route path="/product/:id" element={<ProductPage/>}></Route>
        <Route path="/flash" element={<FlashSale/>}></Route>
      </Routes>
      <Footer></Footer>
      <Toaster/>
    </div>
  )
}
