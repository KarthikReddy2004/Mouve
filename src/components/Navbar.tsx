"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedThemeToggle } from "../components/animated-theme-toggle";
import { Button } from "./ui/button";
import LoginModal from "./Login";
import { getProfileImage } from "@/utils/getProfileImage";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, profile, logout, isUserOnboarded } = useAuth();
  const profileRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/classes", label: "Classes" },
    { href: "/plans", label: "Plans" },
  ];

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (profileOpen && profileRef.current && dropdownRef.current) {
      const profileRect = profileRef.current.getBoundingClientRect();
      const dropdownWidth = dropdownRef.current.offsetWidth;
      setDropdownPosition({
        top: profileRect.bottom + window.scrollY + 8,
        left: profileRect.right + window.scrollX - dropdownWidth,
      });
    }
  }, [profileOpen]);

  const handleLoginClick = () => {
    setLoginOpen(true);
    setMobileMenuOpen(false);
  };

  const lineVariants = {
    top: { closed: { rotate: 0, y: 0 }, open: { rotate: -45, y: 6 } },
    middle: { closed: { rotate: 0, opacity: 1 }, open: { rotate: 45, opacity: 1 } },
    bottom: { closed: { x: 0, opacity: 1 }, open: { x: 30, opacity: 0 } },
  };

  return (
    <>
      <header className="navbar-header">
        <div className="navbar-container">
          <div className="navbar-left">
            <a href="/" className="navbar-brand">
              <span className="navbar-brand-text">Mouve</span>
            </a>
          </div>

          <div className="navbar-center">
            <nav className="navbar-nav">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="navbar-nav-link">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="navbar-right flex items-center space-x-4">
            <div className="hidden md:block mr-4 navbar-theme-toggle">
                  <AnimatedThemeToggle />
                </div>
            {user && isUserOnboarded && (
              <div className="hidden md:flex items-center">
                <button
                  ref={profileRef}
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  <img
                    src={getProfileImage(user.photoURL, user.displayName)}
                    alt="User profile"
                    className="h-8 w-8 rounded-full"
                  />
                </button>
              </div>
            )}

            {/* Desktop/Not onboarded Signup */}
            {(!user || (user && !isUserOnboarded)) && (
              <div className="hidden md:flex">
                <Button variant="outline" onClick={handleLoginClick}>
                  {user ? "Continue Onboarding" : "SignUp"}
                </Button>
              </div>
            )}

            {/* Mobile Profile Image (does nothing) */}
            {user && isUserOnboarded && (
              <div className="md:hidden">
                <img
                  src={getProfileImage(
                    profile?.photoURL as string | undefined,
                    (profile?.name as string) || user?.displayName || "User"
                  )}
                  alt="User profile"
                  className="h-8 w-8 rounded-full"
                />
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="mobile-menu-button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <motion.div animate={mobileMenuOpen ? "open" : "closed"} className="hamburger-icon">
                <motion.span variants={lineVariants.top} transition={{ duration: 0.3, ease: "easeInOut" }} className="hamburger-line" />
                <motion.span variants={lineVariants.middle} transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }} className="hamburger-line" />
                <motion.span variants={lineVariants.bottom} transition={{ duration: 0.3, delay: 0.15, ease: "easeInOut" }} className="hamburger-line" />
              </motion.div>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mobile-menu-overlay"
          >
            <nav className="mobile-menu-nav">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: 0.1 }} className="space-y-8">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="mobile-menu-nav-link"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </motion.div>
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25 }}
              className="mobile-menu-footer"
            >
              <div className="mobile-menu-toggle-container">
                <AnimatedThemeToggle />
              </div>

              {user && isUserOnboarded ? (
                <Button
                  variant="outline"
                  className="mobile-menu-logout-button text-red-600 hover:bg-red-100 w-full"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="mobile-menu-logout-button w-full"
                  onClick={handleLoginClick}
                >
                  {user ? "Continue Onboarding" : "SignUp"}
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      {createPortal(
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ position: 'absolute', top: dropdownPosition.top, left: dropdownPosition.left }}
              className="w-min whitespace-nowrap bg-white rounded-md shadow-lg z-50"
            >
              <div className="py-1">
                <Button
                  variant="ghost"
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
