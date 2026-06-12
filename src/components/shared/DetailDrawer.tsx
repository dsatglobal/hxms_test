/**
 * Off-canvas detail drawer — slides in from the right with a backdrop.
 * Exports content helpers: DrawerSection, DrawerField.
 */
import React, { useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { T } from './ui';

export interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  width?: string;
  title: ReactNode;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open, onClose, width = '480px', title, subtitle, headerActions, children, footer,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            className="fixed top-0 right-0 bottom-0 z-50 bg-white shadow-2xl flex flex-col max-w-full"
            style={{ width }}
            initial={{ x: parseInt(width, 10) || 480 }}
            animate={{ x: 0 }}
            exit={{ x: parseInt(width, 10) || 480 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Sticky header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="min-w-0">
                <div className={`${T.drawerTitle} flex items-center gap-2 flex-wrap`}>{title}</div>
                {subtitle && <div className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</div>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {headerActions}
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {/* Sticky footer */}
            {footer && (
              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-end gap-2 flex-wrap">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const DrawerSection: React.FC<{ title: string; children: ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`mb-5 ${className ?? ''}`}>
    <div className={`${T.sectionHeader} pb-1.5 mb-3 border-b border-slate-100`}>{title}</div>
    {children}
  </div>
);

export const DrawerFieldGrid: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
);

export const DrawerField: React.FC<{
  label: string;
  value: ReactNode;
  bold?: boolean;
  /** Span both columns of the grid */
  full?: boolean;
}> = ({ label, value, bold, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <div className={T.drawerLabel}>{label}</div>
    <div className={`${T.drawerValue} ${bold ? 'font-bold' : ''} mt-0.5 break-words`}>
      {value === undefined || value === null || value === '' ? <span className="text-slate-300">—</span> : value}
    </div>
  </div>
);

export default DetailDrawer;
