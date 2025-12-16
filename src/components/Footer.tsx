"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SIcon from "../assets/Strength.png";
import "./Footer.css";
import { InstagramIcon, FacebookIcon, WhatsAppIcon, TwitterIcon, LinkedInIcon } from './SocialIcons';

export default function Footer() {
  const [currentWord, setCurrentWord] = useState(0);
  const words = ["Strength", "Flexibility", "Mindfulness"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  const currentYear = new Date().getFullYear();

  const column1Links = [
    { href: "/classes", label: "Classes" },
    { href: "/plans", label: "Subscriptions" },
  ];

  const column2Links = [
    { href: "/contact", label: "Contact" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms & Conditions" },
  ];

  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="footer-brand-section"
          >
            <h3 className="footer-brand-title">MOUVE</h3><br/>

            <div className="footer-word-animation-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWord}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="footer-word-animation-item"
                >
                  {words[currentWord] === "Strength" && (
                    <div className="flex items-center gap-2">
                      <img
                        src={SIcon}
                        alt="Strength"
                        width={120}
                        height={120}
                        className="footer-strength-icon"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {words[currentWord] === "Flexibility" && (
                    <motion.span
                      initial={{ scaleX: 0.75 }}
                      animate={{ scaleX: [0.75, 1.7, 0.9, 1.3, 1] }}
                      exit={{ scaleX: 0.75 }}
                      transition={{
                        duration: 1.2,
                        ease: "easeInOut",
                        times: [0, 0.3, 0.5, 0.7, 1],
                      }}
                      className="footer-flexibility-text"
                    >
                      Flexibility
                    </motion.span>
                  )}

                  {words[currentWord] === "Mindfulness" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="footer-mindfulness-glow-container"
                    >
                      <motion.div
                        className="footer-mindfulness-glow"
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.span
                        className="footer-mindfulness-text"
                        animate={{
                          opacity: [0.9, 1, 0.9],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        Mindfulness
                      </motion.span>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="footer-links-group-one"
          >
            {column1Links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className="footer-link"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="footer-links-group-two"
          >
            {column2Links.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                className="footer-link"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        </div>

        <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, delay: 0.3 }}
  className="footer-bottom-row"
>
  {/* Address on the left */}
  <a
    href="https://www.google.com/maps/search/?api=1&query=2nd+Floor,+MOUVE+Cafe+de+Pilates,+Old+Mumbai+Highway,+Gachibowli+Chowrasta,+Gachibowli,+Hyderabad+500032"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-address-link text-foreground"
  >
    2nd Floor, MOUVE Cafe de Pilates, Gachibowli, Hyderabad 500032
  </a>

  {/* Social icons on the right */}
  <div className="footer-social-icons">
    <a href="https://www.instagram.com/mouvepilatesstudio" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
      <InstagramIcon />
    </a>
    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
      <FacebookIcon />
    </a>
    <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
      <WhatsAppIcon />
    </a>
    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
      <TwitterIcon />
    </a>
    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
      <LinkedInIcon />
    </a>
  </div>
</motion.div>


        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="footer-copyright"
        >
          © {currentYear} MOUVE. All rights reserved.
        </motion.div>
      </div>
    </footer>
  );
}
