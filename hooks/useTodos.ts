"use client";

import { useCallback, useMemo, useState } from "react";
import { initialTodos } from "@/data/todos";
import type { Todo } from "@/types";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const addTodo = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), label: trimmed, completed: false }]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  return { todos, addTodo, toggleTodo, removeTodo, completedCount };
}
