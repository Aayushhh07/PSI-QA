import './App.css';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { About } from './components/About';
import { TestDetails } from './components/TestDetails';

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="sticky top-0 z-50 backdrop-blur bg-slate-900/60 ring-1 ring-white/10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              <img src="/favicon.ico" alt="PSI" className="h-5 w-5" />
              PSI QA Dashboard
            </Link>
            {/* Desktop nav */}
            <div className="hidden sm:flex gap-4 text-sm">
              <NavLink to="/" className={({isActive})=>`px-3 py-1 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>Dashboard</NavLink>
              <NavLink to="/analytics" className={({isActive})=>`px-3 py-1 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>Analytics</NavLink>
              <NavLink to="/about" className={({isActive})=>`px-3 py-1 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>About</NavLink>
            </div>
            {/* Hamburger */}
            <button className="sm:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10" aria-label="Open menu" onClick={()=>setOpen(o=>!o)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
          </div>
          {/* Mobile menu */}
          {open && (
            <div className="sm:hidden border-t border-white/10">
              <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2 text-sm">
                <NavLink onClick={()=>setOpen(false)} to="/" className={({isActive})=>`px-3 py-2 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>Dashboard</NavLink>
                <NavLink onClick={()=>setOpen(false)} to="/analytics" className={({isActive})=>`px-3 py-2 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>Analytics</NavLink>
                <NavLink onClick={()=>setOpen(false)} to="/about" className={({isActive})=>`px-3 py-2 rounded ${isActive?'bg-white/10':'hover:bg-white/5'}`}>About</NavLink>
              </div>
            </div>
          )}
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
          <Route path="/details/:site/:executionId" element={<TestDetails />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
