/**
 * Page Placeholder Component
 * Used for pages that are not yet implemented
 */

'use client';

import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function PagePlaceholder({
  title,
  description = 'This page is under construction and will be available soon.',
  icon,
}: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-sidebar/10 mb-6"
        >
          {icon || <Construction className="h-10 w-10 text-sidebar" />}
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>

        {/* Description */}
        <p className="text-gray-500 mb-8">{description}</p>

        {/* Back Button */}
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
