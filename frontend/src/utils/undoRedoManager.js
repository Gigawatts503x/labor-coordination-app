/**
 * UndoRedoManager - Manages undo/redo history for schedule changes
 * Supports Ctrl+Z and Ctrl+Y shortcuts
 */

export class UndoRedoManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
    this.listeners = [];
  }

  /**
   * Push an action onto the history stack
   * @param {Object} action - Action object with before/after state
   */
  push(action) {
    // Remove any redo history when a new action is performed
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(action);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }

    this.notifyListeners('action', action);
  }

  /**
   * Undo the last action
   * @returns {Object|null} - The undone action or null if nothing to undo
   */
  undo() {
    if (this.currentIndex < 0) return null;

    const action = this.history[this.currentIndex];
    this.currentIndex--;

    this.notifyListeners('undo', action);
    return action;
  }

  /**
   * Redo the last undone action
   * @returns {Object|null} - The redone action or null if nothing to redo
   */
  redo() {
    if (this.currentIndex >= this.history.length - 1) return null;

    this.currentIndex++;
    const action = this.history[this.currentIndex];

    this.notifyListeners('redo', action);
    return action;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear all history
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.notifyListeners('clear', null);
  }

  /**
   * Get current state info
   */
  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.history.length,
      currentIndex: this.currentIndex
    };
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners(type, action) {
    this.listeners.forEach(listener => {
      listener({
        type,
        action,
        state: this.getState()
      });
    });
  }

  /**
   * Create an action object
   */
  static createAction(type, entity, before, after, metadata = {}) {
    return {
      id: `action-${Date.now()}-${Math.random()}`,
      type, // 'assign', 'update', 'delete', 'reschedule'
      entity, // 'assignment', 'requirement', etc
      before,
      after,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }
}

/**
 * Hook for React components to use undo/redo
 */
export function useUndoRedo(initialState = null) {
  const [manager] = React.useState(() => new UndoRedoManager());
  const [state, setState] = React.useState({
    canUndo: false,
    canRedo: false
  });

  React.useEffect(() => {
    const unsubscribe = manager.subscribe((update) => {
      setState(update.state);
    });
    return unsubscribe;
  }, [manager]);

  const handleUndo = React.useCallback((onUndo) => {
    const action = manager.undo();
    if (action && onUndo) {
      onUndo(action);
    }
  }, [manager]);

  const handleRedo = React.useCallback((onRedo) => {
    const action = manager.redo();
    if (action && onRedo) {
      onRedo(action);
    }
  }, [manager]);

  // Listen for Ctrl+Z and Ctrl+Y
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return {
    manager,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undo: handleUndo,
    redo: handleRedo,
    push: (action) => manager.push(action),
    clear: () => manager.clear()
  };
}

export default UndoRedoManager;
