"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LoginModal from "@/components/Login";

/* Animation variants */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

/* Static Data */
const classes = Object.freeze([
  { name: "Reformer Pilates", desc: "Core strength & posture on the reformer" },
  { name: "Mat Pilates", desc: "Bodyweight precision and control" },
  { name: "Hatha Yoga", desc: "Classical yoga for balance and calm" },
  { name: "Hot Pilates", desc: "High-intensity in infrared heat" },
  { name: "Hot Yoga", desc: "Detoxifying flow in 38°C warmth" },
]);

const instructors = Object.freeze([
  {
    name: "Hemanth",
    role: "Lifestyle coach • contest prep coach • bodybuilder • powerlifter • sports nutritionist • pilates instructor",
    desc: "Reformer Certified • 10+ years experience",
    img: "/Hemanth.jpeg",
  },
  {
    name: "Yashoda Gangadhar",
    role: "Yoga trainer • Pilates coach • Clinical Nutritionist",
    desc: "Reformer Certified • 5+ years experience",
    img: "/Yashoda.jpeg",
  },
  {
    name: "Sunil",
    role: "Fitness coach • pilates instructor",
    desc: "Reformer Certified • 5+ years experience",
    img: "/Sunil.jpeg",
  },
]);

const testimonials = Object.freeze([
  {
    name: "User1",
    text: "Best studio in the city. The attention to detail and energy is unmatched.",
  },
  // {
  //   name: "User2",
  //   text: "Transformed my posture and back pain in just 2 months of Reformer classes.",
  // },
  // {
  //   name: "User3",
  //   text: "Finally found a place that feels like home. The hot yoga classes are life-changing.",
  // },
]);

/* Landing Page Component */
export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-center px-4 sm:px-6">
        <div className="absolute inset-0 -z-10">
          <img
            src="/DSC06470.jpeg"
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 text-white">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-wide"
          >
            MOUVE
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-2xl font-light"
          >
            Strength • Flexibility • Mindfulness
          </motion.p>

          {/* Class Tags */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-wrap justify-center gap-2 sm:gap-4"
          >
            {classes.map((c, i) => (
              <motion.span
                key={c.name}
                variants={fadeScale}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.2 + i * 0.1 }}
                className="px-3 sm:px-6 py-2 bg-white/70 text-black rounded-full text-sm sm:text-base"
              >
                {c.name}
              </motion.span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6 w-full"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto px-6 py-4 text-lg rounded-full shadow-xl"
              onClick={() => setLoginOpen(true)}
              aria-label="Book your first class at MOUVE"
            >
              Book Your First Class
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-6 py-4 text-lg rounded-full bg-white/10 text-white border-white/30"
            >
              <a href="#classes">Learn More</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CLASSES */}
      <section id="classes" className="py-20 bg-muted px-4 sm:px-6" aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="text-3xl sm:text-4xl md:text-5xl text-foreground font-light text-center mb-12">
          Our Classes
        </h2>

        <div className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 sm:p-10 text-center hover:shadow-2xl transition-all">
                <h3 className="text-xl sm:text-2xl text-muted-foreground font-medium mb-2">{cls.name}</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{cls.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 bg-background text-center px-4 sm:px-6">
        <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" className="text-3xl text-foreground sm:text-4xl md:text-5xl font-light mb-6">
          Move with Intention
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
        >
          At MOUVE, we believe movement is medicine — a way to strengthen the body, calm the mind, and elevate everyday life.
        </motion.p>
      </section>

      {/* INSTRUCTORS */}
      <section className="py-16 sm:py-20 bg-muted px-4 sm:px-6">
  <h2 className="text-3xl sm:text-4xl md:text-5xl text-foreground font-light text-center mb-12">
    Meet Our Founders
  </h2>

  <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-2 md:grid-cols-3">
    {instructors.map((inst, i) => {
      const imageSrc = inst.img?.trim() || "/placeholder-avatar.jpg";

      return (
        <motion.figure
          key={inst.name}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          whileHover={{ y: -6 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
          className="text-center"
        >
          {/* Image */}
          <div className="mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden shadow-2xl mb-4">
            <img
              src={imageSrc}
              alt={`${inst.name}, ${inst.role}`}
              width={192}
              height={192}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Text */}
          <figcaption>
            <h3 className="text-lg sm:text-xl text-foreground font-semibold tracking-wide">
              {inst.name}
            </h3>

            <p
              className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto"
              aria-label="Instructor role"
            >
              {inst.role}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {inst.desc}
            </p>
          </figcaption>
        </motion.figure>
      );
    })}
  </div>
</section>


      {/* TESTIMONIALS */}
      <section className="py-20 bg-foreground text-background px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-center mb-12">Loved by Our Community</h2>
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 sm:p-8 bg-background/10 backdrop-blur border-border">
                <p className="text-base sm:text-lg italic mb-4">“{t.text}”</p>
                <p className="font-medium">— {t.name}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-accent text-accent-foreground text-center px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-light mb-4">Your Journey Starts Here</h2>
        <p className="text-base sm:text-lg md:text-xl mb-6">First class is on us. Claim your complimentary session today.</p>
        <Button
          size="lg"
          className="w-full sm:w-auto px-6 py-4 text-lg sm:text-xl rounded-full shadow-2xl"
          onClick={() => setLoginOpen(true)}
        >
          Book Your Class Now
        </Button>
      </section>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
