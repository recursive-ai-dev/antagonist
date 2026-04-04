import { useState, useRef, useEffect, KeyboardEvent, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eye, Hand, MessageSquare, Backpack, Map, Brain, Ear, Wind, HelpCircle, Clock } from 'lucide-react';
import { Button } from './ui';
import { audioEngine } from '@/utils/audio';
import { useAnnouncer, useReducedMotion } from '@/hooks/useAccessibility';

export interface CommandInputRef {
  focus: () => void;
}

interface CommandInputProps {
  onSubmit: (command: string) => void;
  commandHistory: string[];
  disabled?: boolean;
  placeholder?: string;
  onDirectionalMove?: (direction: string) => void;
}

export const CommandInput = forwardRef<CommandInputRef, CommandInputProps>(function CommandInput(
  { onSubmit, commandHistory, disabled = false, placeholder = 'Enter command...', onDirectionalMove },
  ref
) {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showActions, setShowActions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { announce } = useAnnouncer();
  const prefersReducedMotion = useReducedMotion();

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      announce(`Command submitted: ${input}`, 'polite');
      onSubmit(input);
      setInput('');
      setHistoryIndex(-1);
    }
  };

  const handleDirectionalClick = (direction: string, label: string) => {
    if (!disabled) {
      announce(`Moving ${label}`, 'polite');
      onDirectionalMove?.(direction);
    }
  };

  const handleActionClick = (command: string, label: string) => {
    if (!disabled) {
      announce(`Action: ${label}`, 'polite');
      onDirectionalMove?.(command);
      setShowActions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1
          ? historyIndex + 1
          : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple auto-complete suggestion
      const suggestions = [
        'help', 'look', 'go', 'examine', 'take', 'inventory',
        'talk', 'listen', 'smell', 'status', 'exits', 'think', 'wait'
      ];
      const match = suggestions.find(s => s.startsWith(input.toLowerCase()));
      if (match) {
        setInput(match);
        announce(`Autocompleted: ${match}`, 'polite');
      }
    }
  };

  // Play typing sound on input change
  useEffect(() => {
    if (input.length > 0) {
      audioEngine.playTypingSound();
    }
  }, [input]);

  return (
    <motion.div
      className="tunnel-border mx-2 sm:mx-3 mt-2 p-2.5 sm:p-3 flex-shrink-0 rounded"
      style={{ background: 'var(--soil-deep)' }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          className="text-[var(--clay-orange)] flex-shrink-0 opacity-90"
          animate={prefersReducedMotion ? {} : { opacity: [0.7, 1, 0.7] }}
          transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.span>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 command-input bg-transparent outline-none min-w-0 px-2 py-1.5 text-sm sm:text-base"
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={disabled}
        />

        <Button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          size="md"
          icon={<Send className="w-4 h-4" />}
          className="tracking-wide font-semibold px-4"
        >
          <span className="hidden sm:inline">EXECUTE</span>
        </Button>
      </div>

      {/* Actions Menu Toggle - Improved */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Button
          onClick={() => setShowActions(!showActions)}
          disabled={disabled}
          variant="secondary"
          size="sm"
          icon={<HelpCircle className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
          aria-expanded={showActions}
          aria-controls="actions-menu"
        >
          {showActions ? 'Hide Actions' : 'Show Actions'}
        </Button>
      </div>

      {/* Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            id="actions-menu"
            className="mt-3 space-y-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Directional Movement */}
            <div className="actions-section">
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 font-rajdhani">
                Movement
              </h4>
              <div className="flex items-center justify-center gap-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <div />
                  <ActionButton
                    icon={<ArrowUp className="w-4 h-4" />}
                    label="North"
                    command="north"
                    onClick={handleActionClick}
                    disabled={disabled}
                  />
                  <div />
                  
                  <ActionButton
                    icon={<ArrowLeft className="w-4 h-4" />}
                    label="West"
                    command="west"
                    onClick={handleActionClick}
                    disabled={disabled}
                  />
                  <ActionButton
                    icon={<ArrowDown className="w-4 h-4" />}
                    label="South"
                    command="south"
                    onClick={handleActionClick}
                    disabled={disabled}
                  />
                  <ActionButton
                    icon={<ArrowRight className="w-4 h-4" />}
                    label="East"
                    command="east"
                    onClick={handleActionClick}
                    disabled={disabled}
                  />
                </div>
                
                <div className="ml-4 flex flex-col gap-1.5">
                  <ActionButton
                    icon={<span className="text-xs font-bold">U</span>}
                    label="Up"
                    command="up"
                    onClick={handleActionClick}
                    disabled={disabled}
                    size="sm"
                  />
                  <ActionButton
                    icon={<span className="text-xs font-bold">D</span>}
                    label="Down"
                    command="down"
                    onClick={handleActionClick}
                    disabled={disabled}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Observation Actions */}
            <div className="actions-section">
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 font-rajdhani">
                Observation
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Look"
                  command="look"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Eye className="w-4 h-4" />}
                  label="Examine"
                  command="examine"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Ear className="w-4 h-4" />}
                  label="Listen"
                  command="listen"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Wind className="w-4 h-4" />}
                  label="Smell"
                  command="smell"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Interaction Actions */}
            <div className="actions-section">
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 font-rajdhani">
                Interaction
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ActionButton
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Talk"
                  command="talk"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Hand className="w-4 h-4" />}
                  label="Take"
                  command="take"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Backpack className="w-4 h-4" />}
                  label="Inventory"
                  command="inventory"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Map className="w-4 h-4" />}
                  label="Exits"
                  command="exits"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* Status & Other Actions */}
            <div className="actions-section">
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 font-rajdhani">
                Status & Other
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ActionButton
                  icon={<Brain className="w-4 h-4" />}
                  label="Status"
                  command="status"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Brain className="w-4 h-4" />}
                  label="Think"
                  command="think"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<Clock className="w-4 h-4" />}
                  label="Wait"
                  command="wait"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
                <ActionButton
                  icon={<HelpCircle className="w-4 h-4" />}
                  label="Help"
                  command="help"
                  onClick={handleActionClick}
                  disabled={disabled}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command history hint */}
      {commandHistory.length > 0 && !showActions && (
        <motion.div
          className="mt-2 text-sm text-[var(--text-dim)] flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-[var(--text-secondary)] font-semibold">↑↓</span>
          <span>to navigate history</span>
          <span className="text-[var(--root-brown)]">•</span>
          <span className="text-[var(--text-secondary)] font-semibold">Tab</span>
          <span>to autocomplete</span>
          <span className="text-[var(--root-brown)]">•</span>
          <span>Use actions menu or arrows</span>
        </motion.div>
      )}
    </motion.div>
  );
});

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  command: string;
  onClick: (command: string, label: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

function ActionButton({ icon, label, command, onClick, disabled = false, size = 'md' }: ActionButtonProps) {
  const handleClick = () => {
    onClick(command, label);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      size={size}
      variant="secondary"
      className={`flex items-center justify-center gap-2 ${size === 'sm' ? 'min-w-[40px] px-2' : 'min-w-[60px] px-3'}`}
      aria-label={label}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline text-xs">{label}</span>
    </Button>
  );
}
