"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { projectCategories } from "@/data/projects";
import type { Project } from "@/types";

type CategoryId = (typeof projectCategories)[number]["id"];

interface ProjectExplorerProps {
  projects: Project[];
}

function matchesCategory(project: Project, category: CategoryId) {
  if (category === "all") return true;
  if (project.category === category) return true;
  return project.alsoIn?.includes(category) ?? false;
}

export function ProjectExplorer({ projects }: ProjectExplorerProps) {
  const [active, setActive] = useState<CategoryId>("all");
  const reduceMotion = useReducedMotion();

  const visible = projects.filter((project) => matchesCategory(project, active));

  return (
    <div className="flex flex-col gap-10">
      <ul
        aria-label="Filter projects by category"
        className="flex flex-wrap gap-2 border-b border-line pb-4"
      >
        {projectCategories.map((category) => {
          const isActive = category.id === active;
          return (
            <li key={category.id}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(category.id)}
                className={`min-h-11 rounded-full border px-4 font-display text-sm transition ${
                  isActive
                    ? "border-linestrong bg-accentsoft text-accent"
                    : "border-line text-dim hover:text-ink"
                }`}
              >
                {category.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((project, index) => (
            <motion.div
              key={project.slug}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={index === 0 ? "md:col-span-2" : undefined}
            >
              <ProjectCard project={project} featured={index === 0} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 ? (
          <p role="status" className="panel rounded-3xl p-10 text-center text-dim md:col-span-2">
            No projects in this category yet. Check back soon or browse all projects.
          </p>
        ) : null}
      </div>
    </div>
  );
}
