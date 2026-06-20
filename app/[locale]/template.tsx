'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// Subtle fade-up transition applied on every navigation within a locale.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
