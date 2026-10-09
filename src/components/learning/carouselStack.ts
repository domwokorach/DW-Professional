type StackCard = { id: string };

export function bringCardToFront<T extends StackCard>(stack: T[], id: string) {
  const selected = stack.find((card) => card.id === id);
  return selected ? [...stack.filter((card) => card.id !== id), selected] : stack;
}

export function showPreviousCard<T extends StackCard>(stack: T[]) {
  return stack.length > 1 ? [...stack.slice(1), stack[0]] : stack;
}

export function showNextCard<T extends StackCard>(stack: T[]) {
  const active = stack.at(-1);
  return active ? [active, ...stack.slice(0, -1)] : stack;
}
