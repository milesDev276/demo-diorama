"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, X, ListTodo } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTodos } from "@/hooks/useTodos";
import { cn } from "@/lib/cn";

export function TodoList() {
  const { todos, addTodo, toggleTodo, removeTodo, completedCount } = useTodos();
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    addTodo(draft);
    setDraft("");
  };

  const progress = todos.length === 0 ? 0 : (completedCount / todos.length) * 100;

  return (
    <Card className="flex w-full flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-[#8B6F52]" />
          <h2 className="font-semibold text-[#FDF6EC]">Today&apos;s Tasks</h2>
        </div>
        <span className="text-xs font-medium text-[#FDF6EC]/70">
          {completedCount}/{todos.length} done
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/15">
        <motion.div
          className="h-full rounded-full bg-[#A7C4A0]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {todos.map((todo) => (
            <motion.li
              key={todo.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className="group flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.completed ? "Mark as not done" : "Mark as done"}
                className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                  todo.completed
                    ? "border-[#A7C4A0] bg-[#A7C4A0] text-[#2F3B2C]"
                    : "border-[#FDF6EC]/50 text-transparent hover:border-[#FDF6EC]"
                )}
              >
                <Check size={12} strokeWidth={3} />
              </button>

              <motion.span
                animate={{ opacity: todo.completed ? 0.5 : 1 }}
                className={cn(
                  "flex-1 truncate text-sm text-[#FDF6EC] transition-all",
                  todo.completed && "line-through decoration-[#FDF6EC]/60"
                )}
              >
                {todo.label}
              </motion.span>

              <button
                type="button"
                onClick={() => removeTodo(todo.id)}
                aria-label="Delete task"
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[#FDF6EC]/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-[#FDF6EC] group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a task..."
          className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-[#FDF6EC] placeholder:text-[#FDF6EC]/40 outline-none focus:border-[#F0B27A]/60"
        />
        <Button onClick={handleAdd} aria-label="Add task" className="!px-3">
          <Plus size={16} />
        </Button>
      </div>
    </Card>
  );
}
