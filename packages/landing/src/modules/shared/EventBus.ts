type EventCallback = (data: any) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  ADD_TO_CART: 'cart:add',
  REMOVE_FROM_CART: 'cart:remove',
  CART_UPDATED: 'cart:updated',
  USER_LOGIN: 'auth:login',
  USER_LOGOUT: 'auth:logout',
  THEME_TOGGLE: 'theme:toggle'
} as const;
