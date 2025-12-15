/**
 * Drag-Drop Manager - Manages state for drag-and-drop operations
 */

export class DragDropManager {
  constructor() {
    this.draggedTech = null;
    this.dragSource = null;
    this.dropTarget = null;
    this.isOverTarget = false;
    this.listeners = [];
  }

  /**
   * Start dragging a tech
   */
  startDrag(tech, source = 'sidebar') {
    this.draggedTech = tech;
    this.dragSource = source;
    this.notifyListeners('dragStart', { tech, source });
  }

  /**
   * End drag operation
   */
  endDrag() {
    const result = {
      tech: this.draggedTech,
      source: this.dragSource,
      target: this.dropTarget
    };
    this.draggedTech = null;
    this.dragSource = null;
    this.dropTarget = null;
    this.isOverTarget = false;
    this.notifyListeners('dragEnd', result);
    return result;
  }

  /**
   * Set drop target
   */
  setDropTarget(target) {
    this.dropTarget = target;
    this.notifyListeners('dropTargetChange', target);
  }

  /**
   * Set hover state
   */
  setOverTarget(isOver) {
    this.isOverTarget = isOver;
    this.notifyListeners('hoverChange', isOver);
  }

  /**
   * Get current drag state
   */
  getState() {
    return {
      isDragging: !!this.draggedTech,
      draggedTech: this.draggedTech,
      dragSource: this.dragSource,
      dropTarget: this.dropTarget,
      isOverTarget: this.isOverTarget
    };
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners
   */
  notifyListeners(type, data) {
    this.listeners.forEach(listener => {
      listener({ type, data, state: this.getState() });
    });
  }

  /**
   * Clear state
   */
  clear() {
    this.draggedTech = null;
    this.dragSource = null;
    this.dropTarget = null;
    this.isOverTarget = false;
  }
}

export default DragDropManager;

