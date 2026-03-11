"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Users,
    title: "Group Creation",
    description: "Create groups for teams, projects, or social events and invite members seamlessly.",
  },
  {
    icon: Calendar,
    title: "Availability Grid",
    description: "Members fill in their availability with an intuitive interactive grid interface.",
  },
  {
    icon: Zap,
    title: "Smart Scheduling",
    description: "Our algorithm finds the optimal meeting time where the most members are available.",
  },
  {
    icon: CheckCircle,
    title: "One-Click Confirm",
    description: "Admins confirm the best slot and everyone gets notified instantly.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Row-level security ensures your data stays private. Only group members see your availability.",
  },
  {
    icon: BarChart3,
    title: "Real-time Updates",
    description: "See availability updates in real-time as your team members fill in their schedules.",
  },
];

const steps = [
  { step: "1", title: "Create a Group", description: "Start by creating a group and inviting your team." },
  { step: "2", title: "Share Availability", description: "Each member fills in their available time slots." },
  { step: "3", title: "Find the Best Time", description: "Our algorithm finds when most people are free." },
  { step: "4", title: "Confirm & Meet", description: "Lock in the time and everyone gets notified." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5"
          />
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-1/4 top-1/4 h-4 w-4 rounded-full bg-primary/20"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/3 top-1/3 h-3 w-3 rounded-full bg-primary/30"
          />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Zap className="mr-2 h-3.5 w-3.5 text-primary" />
              Smart scheduling for modern teams
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Find the{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Perfect Time
            </span>{" "}
            to Meet
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Stop the back-and-forth emails. Create a group, share your availability,
            and let MeetSync find when everyone is free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/login">
              <Button size="lg" className="gap-2 text-base">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base">
                See How It Works
              </Button>
            </a>
          </motion.div>

          {/* Animated illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mx-auto mt-16 max-w-3xl"
          >
            <div className="rounded-xl border bg-card p-4 shadow-2xl sm:p-8">
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, di) => (
                  <div key={day} className="text-center">
                    <span className="mb-2 block text-xs font-medium text-muted-foreground sm:text-sm">
                      {day}
                    </span>
                    {[0, 1, 2, 3, 4].map((slot) => {
                      const isHighlighted = (di === 1 && slot >= 1 && slot <= 3) ||
                        (di === 3 && slot >= 2 && slot <= 4) ||
                        (di === 2 && slot >= 1 && slot <= 4);
                      return (
                        <motion.div
                          key={slot}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + di * 0.05 + slot * 0.03 }}
                          className={`mb-1 h-6 rounded sm:h-8 ${
                            isHighlighted
                              ? "bg-primary/20 border border-primary/30"
                              : "bg-muted"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/30 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Everything you need to schedule meetings
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
            >
              A powerful yet simple platform to coordinate schedules and find the best meeting time.
            </motion.p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground"
            >
              Schedule a meeting in 4 simple steps.
            </motion.p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-2">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 px-4 py-20 sm:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Ready to simplify scheduling?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="mt-4 text-lg text-muted-foreground"
          >
            Join thousands of teams who use MeetSync to find the perfect meeting time.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="mt-8">
            <Link href="/login">
              <Button size="lg" className="gap-2 text-base">
                Start Scheduling Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Developer Credits */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-8 rounded-xl border bg-card p-6 text-center shadow-sm"
          >
            <p className="mb-3 text-sm font-medium text-muted-foreground">This website was developed by</p>
            <div className="flex justify-center mb-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30 shadow-lg">
                <Image
                  src="/shivam.png"
                  alt="Shivam Maheshwari"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold">Mr. Shivam Maheshwari</h3>
            <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-6">
              <a href="tel:+919468955596" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <span>📞</span> +91 9468955596
              </a>
              <a href="mailto:theshivammaheshwari@gmail.com" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <span>✉️</span> theshivammaheshwari@gmail.com
              </a>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
              <a
                href="https://www.instagram.com/shivam.maheshwary1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 transition-colors hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/theshivammaheshwari"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 transition-colors hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30"
              >
                Facebook
              </a>
              <a
                href="https://www.linkedin.com/in/shivammaheshwary1/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 transition-colors hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30"
              >
                LinkedIn
              </a>
            </div>
          </motion.div>

          {/* Grateful Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mb-8 rounded-xl border bg-card p-6 text-center shadow-sm"
          >
            <p className="mb-3 text-sm font-medium text-muted-foreground">Grateful to</p>
            <div className="flex justify-center mb-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30 shadow-lg">
                <Image
                  src="/abhishek.png"
                  alt="Abhishek Jain"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold">Mr. Abhishek Jain</h3>
            <p className="mt-2 text-muted-foreground">for providing insightful suggestions.</p>
            <div className="mt-4 flex justify-center">
              <a
                href="https://www.linkedin.com/in/abhishek-jain007/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30"
              >
                LinkedIn
              </a>
            </div>
          </motion.div>

          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">MeetSync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} MeetSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
