"use client";

import { useState } from "react";
import { CategoryList } from "./category-list";
import { TaskList } from "./task-list";

export function TasksBoard() {
  const [revision, setRevision] = useState(0);

  return (
    <>
      <div className="mt-8">
        <CategoryList onCreated={() => setRevision((current) => current + 1)} />
      </div>
      <div className="mt-12">
        <TaskList revision={revision} />
      </div>
    </>
  );
}
