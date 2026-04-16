'use client';

import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  /** 슬라이드 방향: 'forward' (다음 스텝), 'back' (이전 스텝) */
  direction?: 'forward' | 'back';
}

export default function PageTransition({ children, direction = 'forward' }: Props) {
  const x = direction === 'forward' ? 40 : -40;

  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
