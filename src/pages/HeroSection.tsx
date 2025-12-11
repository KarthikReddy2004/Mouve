"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import LoginModal from "@/components/Login";
import "./HeroSection.css";
import Hemanth from "../assets/Hemanth.jpeg";
import Yashoda from "../assets/Yashoda.jpeg";

const classes = [
  { name: "Reformer Pilates", desc: "Core strength & posture on the reformer" },
  { name: "Mat Pilates", desc: "Bodyweight precision and control" },
  { name: "Hatha Yoga", desc: "Classical yoga for balance and calm" },
  { name: "Hot Pilates", desc: "High-intensity in infrared heat" },
  { name: "Hot Yoga", desc: "Detoxifying flow in 38°C warmth" },
];

const instructors = [
  {
    name: "Hemanth",
    role: "Founder & Lead Instructor",
    desc: "500HR RYT • Reformer Certified • 10+ years",
    img: Hemanth,
  },
  {
    name: "Yashoda",
    role: "Hot Yoga & Mindfulness Coach",
    desc: "ERYT-200 • Trauma-Informed • Meditation Guide",
    img: Yashoda,
  },
];

const testimonials = [
  {
    name: "User1",
    text: "Best studio in the city. The attention to detail and energy is unmatched.",
  },
  {
    name: "User2",
    text: "Transformed my posture and back pain in just 2 months of Reformer classes.",
  },
  {
    name: "User3",
    text: "Finally found a place that feels like home. The hot yoga classes are life-changing.",
  },
];

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-section min-h-screen flex items-center justify-center relative bg-background">
        <div className="background-pattern opacity-30" />

        <div className="container relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-8 max-w-5xl mx-auto"
          >
            <h1 className="main-headline text-foreground">Mouve</h1>

            <p className="subheadline text-xl md:text-3xl font-light text-muted-foreground">
              Strength • Flexibility • Mindfulness
            </p>

            {/* CLASS TAGS */}
            <div className="flex flex-wrap justify-center gap-4 my-10">
              {classes.map((c, i) => (
                <motion.span
                  key={c.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="px-6 py-3 bg-foreground/5 backdrop-blur-sm border border-border rounded-full text-sm md:text-base"
                >
                  {c.name}
                </motion.span>
              ))}
            </div>

            {/* CTA BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              {/* Primary Button */}
              <Button
                size="lg"
                className="bg-primary text-primary-foreground px-12 py-7 text-lg rounded-full shadow-xl"
                onClick={() => setLoginOpen(true)}
              >
                Book a Class
              </Button>

              {/* Secondary */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border text-foreground px-12 py-7 text-lg rounded-full"
              >
                <a href="#about">Learn More</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CLASSES GRID */}
      <section className="py-20 px-6 bg-muted">
        <div className="container max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-light text-center mb-16 text-foreground"
          >
            Our Classes
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {classes.map((cls, i) => (
              <motion.div
                key={cls.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="p-10 text-center hover:shadow-2xl transition-shadow border border-border bg-card">
                  <h3 className="text-2xl font-medium text-foreground mb-4">
                    {cls.name}
                  </h3>
                  <p className="text-muted-foreground">{cls.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 px-6 bg-background">
        <div className="container max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-light mb-10 text-foreground"
          >
            Move with Intention
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
          >
            At Mouve, we believe movement is medicine…
          </motion.p>
        </div>
      </section>

      {/* INSTRUCTORS */}
      <section className="py-20 px-6 bg-muted">
        <div className="container max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-light text-center mb-16 text-foreground"
          >
            Meet Your Guides
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-10">
            {instructors.map((inst, i) => (
              <motion.div
                key={inst.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="relative mx-auto w-64 h-64 rounded-3xl overflow-hidden shadow-2xl mb-6">
                  <img
                    src={inst.img}
                    className="w-full h-full object-cover"
                    alt="Instructor"
                  />
                </div>
                <h3 className="text-xl font-medium text-foreground">
                  {inst.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {inst.role}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {inst.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-foreground text-background">
        <div className="container max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-light text-center mb-16"
          >
            Loved by Our Community
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-10">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <Card className="p-8 bg-background/10 backdrop-blur border-border">
                  <p className="text-lg italic mb-6">“{t.text}”</p>
                  <p className="font-medium">— {t.name}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 bg-accent text-accent-foreground">
        <div className="container text-center">
          <h2 className="text-4xl md:text-6xl font-light mb-8">
            Your Journey Starts Here
          </h2>
          <p className="text-xl mb-10">
            First class is on us. Claim your complimentary session today.
          </p>

          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-muted px-12 py-8 text-xl rounded-full shadow-2xl"
            onClick={() => setLoginOpen(true)}
          >
            Book your class NOW!
          </Button>
        </div>
      </section>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
