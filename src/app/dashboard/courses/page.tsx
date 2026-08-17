"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  BookOpenIcon,
  ArrowRightIcon,
  PlayIcon,
  SearchIcon,
  Code2Icon,
  ServerIcon,
  BrainIcon,
  BarChart3Icon,
  SmartphoneIcon,
  CloudIcon,
  DatabaseIcon,
  CpuIcon,
  CheckCircle2Icon,
  SparklesIcon,
  LayersIcon,
  FolderTreeIcon,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  stream: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  isEnrolled: boolean;
  modules?: {
    id: string;
    title: string;
    slug: string;
    order: number;
    topicCount: number;
  }[];
}

interface RoadmapTrack {
  id: string;
  category: "web" | "mobile" | "database" | "devops" | "cs" | "ai";
  title: string;
  description: string;
  steps: {
    stepNumber: number;
    title: string;
    matchSlug: string;
    badge: string;
    description: string;
  }[];
}

const CAREER_ROADMAPS: RoadmapTrack[] = [
  {
    id: "frontend-track",
    category: "web",
    title: "Frontend Engineering Career Roadmap",
    description: "Follow the strict industry progression: HTML5/CSS3 ➔ JavaScript ES6+ ➔ TypeScript ➔ React.js",
    steps: [
      { stepNumber: 1, title: "HTML5, Canvas & CSS3 Masterclass", matchSlug: "html5-css3-masterclass", badge: "Prerequisite 1", description: "Semantic markup, CSS Grid, Flexbox, and responsive UI layout design." },
      { stepNumber: 2, title: "JavaScript Enterprise Mastery (108 Chapters)", matchSlug: "javascript-enterprise-mastery", badge: "Prerequisite 2", description: "ES6+, Event Loop, Promises, DOM manipulation, and V8 engine." },
      { stepNumber: 3, title: "TypeScript Enterprise Architecture", matchSlug: "typescript-enterprise-architecture", badge: "Prerequisite 3", description: "Static typing, generics, interfaces, TSConfig, and React+TS." },
      { stepNumber: 4, title: "React.js Complete Mastery", matchSlug: "reactjs-complete-mastery", badge: "Core Framework", description: "JSX, Hooks (useState, useEffect), Context API, and state management." },
    ]
  },
  {
    id: "backend-track",
    category: "web",
    title: "Backend & Enterprise APIs Roadmap",
    description: "Learn server architectures step-by-step: Node.js/Express ➔ SQL/NoSQL Databases ➔ Auth & Microservices",
    steps: [
      { stepNumber: 1, title: "Node.js & Express Enterprise (110 Chapters)", matchSlug: "nodejs-backend-mastery", badge: "Core Runtime", description: "V8 runtime, HTTP servers, Express middleware, Streams, and async I/O." },
      { stepNumber: 2, title: "MySQL & Relational Databases", matchSlug: "mysql-database-mastery", badge: "Database 1", description: "Tables, joins, indexes, ACID transactions, and query optimization." },
      { stepNumber: 3, title: "MongoDB NoSQL Architecture", matchSlug: "mongodb-nosql-architecture", badge: "Database 2", description: "Document schemas, Mongoose ODM, aggregation pipelines, and sharding." },
      { stepNumber: 4, title: "PHP 8 & Enterprise Backend (109 Chapters)", matchSlug: "php-enterprise-backend", badge: "Enterprise Option", description: "OOP, Composer, PDO, MVC architecture, and secure REST APIs." },
    ]
  },
  {
    id: "fullstack-track",
    category: "web",
    title: "Complete Full-Stack (MERN & PERN) Roadmap",
    description: "Connect React Frontend + Node/Express Backend + PostgreSQL/MongoDB + Next.js",
    steps: [
      { stepNumber: 1, title: "Complete Full-Stack MERN & PERN Roadmap", matchSlug: "complete-fullstack-enterprise-roadmap", badge: "End-to-End", description: "Unified career track connecting React, Node, Express, MongoDB, and Git." },
      { stepNumber: 2, title: "Next.js Fullstack Architecture", matchSlug: "fullstack-nextjs-development", badge: "Modern SSR", description: "Server Components, App Router, Server Actions, and Vercel deployment." },
    ]
  },
  {
    id: "android-track",
    category: "mobile",
    title: "Android Native Mobile Architecture",
    description: "Strict Android progression: Java Core ➔ Kotlin Coroutines ➔ Android Native Architecture",
    steps: [
      { stepNumber: 1, title: "Java Enterprise Architecture (187 Chapters)", matchSlug: "java-enterprise-architecture", badge: "Step 1: Java Core", description: "OOP fundamentals, collections, memory management, and threads." },
      { stepNumber: 2, title: "Kotlin for Android & Multiplatform", matchSlug: "kotlin-android-multiplatform", badge: "Step 2: Kotlin", description: "Null-safety, extension functions, coroutines, and Jetpack Compose." },
      { stepNumber: 3, title: "Android Native Architecture (268 Chapters)", matchSlug: "android-native-architecture", badge: "Step 3: Android SDK", description: "Activities, Fragments, Room Database, Retrofit, and Material UI." },
    ]
  },
  {
    id: "ios-track",
    category: "mobile",
    title: "iOS Native Mobile Architecture",
    description: "Strict Apple progression: Swift Core ➔ Objective-C ➔ iOS Native UIKit & SwiftUI",
    steps: [
      { stepNumber: 1, title: "Swift Programming Language Mastery", matchSlug: "swift-programming-mastery", badge: "Step 1: Swift", description: "Optionals, protocols, closures, ARC memory, and async/await." },
      { stepNumber: 2, title: "iOS Native Development Mastery (212 Chapters)", matchSlug: "ios-native-mastery", badge: "Step 2: iOS SDK", description: "UIKit, SwiftUI, CoreData, URLSession, AutoLayout, and CocoaTouch." },
    ]
  },
  {
    id: "cross-mobile-track",
    category: "mobile",
    title: "Cross-Platform Mobile App Track",
    description: "Build for iOS & Android simultaneously using React Native or Xamarin",
    steps: [
      { stepNumber: 1, title: "React Native Mobile Architecture", matchSlug: "reactnative-mobile-architecture", badge: "React Native", description: "Native bridge, React Native navigation, camera, GPS, and push alerts." },
      { stepNumber: 2, title: "Xamarin.Forms Cross-Platform Development", matchSlug: "xamarin-forms-crossplatform", badge: "C# / Xamarin", description: "XAML UI, MVVM architecture, DependencyService, and custom renderers." },
    ]
  },
  {
    id: "database-track",
    category: "database",
    title: "Database Engineering & SQL Architecture",
    description: "Relational SQL (MySQL, PostgreSQL, MSSQL, Oracle) and Document NoSQL (MongoDB)",
    steps: [
      { stepNumber: 1, title: "MySQL & Relational Databases", matchSlug: "mysql-database-mastery", badge: "Relational SQL", description: "Schema normalization, indexing, stored procedures, and triggers." },
      { stepNumber: 2, title: "PostgreSQL Advanced Architecture", matchSlug: "postgresql-advanced-architecture", badge: "Advanced SQL", description: "JSONB, window functions, full-text search, and connection pools." },
      { stepNumber: 3, title: "MongoDB NoSQL Architecture", matchSlug: "mongodb-nosql-architecture", badge: "Document NoSQL", description: "Document schemas, Mongoose ODM, aggregation pipelines, and sharding." },
      { stepNumber: 4, title: "Microsoft SQL Server Enterprise Mastery", matchSlug: "mssql-server-enterprise-mastery", badge: "Enterprise T-SQL", description: "Execution plans, index tuning, stored procedures, and high availability." },
    ]
  },
  {
    id: "cs-track",
    category: "cs",
    title: "Core Computer Science & Systems Programming",
    description: "Low-level memory architectures: C ➔ C++ Modern Systems ➔ Data Structures & Algorithms",
    steps: [
      { stepNumber: 1, title: "C Systems Programming (65 Chapters)", matchSlug: "c-systems-programming", badge: "Step 1: C Core", description: "Pointers, memory allocation (malloc/free), structs, and POSIX syscalls." },
      { stepNumber: 2, title: "C++ Modern Systems Architecture (148 Chapters)", matchSlug: "cplusplus-modern-systems", badge: "Step 2: C++ Modern", description: "RAII, smart pointers, templates, STL containers, and concurrency." },
      { stepNumber: 3, title: "Data Structures & Algorithms (58 Chapters)", matchSlug: "algorithms-dsa-mastery", badge: "Step 3: Algorithms", description: "Arrays, Linked Lists, Trees, Graphs, Sorting, DP, and Big-O." },
    ]
  },
  {
    id: "datascience-track",
    category: "ai",
    title: "Data Science, Python & AI Architecture",
    description: "From Python core programming to R data science and AI prompt engineering",
    steps: [
      { stepNumber: 1, title: "Python 3 Professional Mastery (203 Chapters)", matchSlug: "python-professional-mastery", badge: "Python Core", description: "OOP, generators, asyncio, FastAPI backends, and data handling." },
      { stepNumber: 2, title: "R Programming for Data Science & Statistics", matchSlug: "r-data-science-mastery", badge: "Statistics & R", description: "Dataframes, ggplot2 visualization, statistical models, and ML." },
      { stepNumber: 3, title: "AI Prompt Engineering & LLM Architecture", matchSlug: "ai-prompt-engineering", badge: "AI & LLMs", description: "System prompts, function calling, RAG pipelines, and agent design." },
    ]
  }
];

const categoryTabs = [
  { label: "All Roadmaps", value: "all", icon: LayersIcon },
  { label: "🌐 Web Development", value: "web", icon: Code2Icon },
  { label: "📱 Mobile App Dev", value: "mobile", icon: SmartphoneIcon },
  { label: "🗄️ Databases & SQL", value: "database", icon: DatabaseIcon },
  { label: "🛠️ DevOps & Systems", value: "devops", icon: CloudIcon },
  { label: "💻 Computer Science (DSA)", value: "cs", icon: CpuIcon },
  { label: "📊 Data Science & AI", value: "ai", icon: BarChart3Icon },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses", { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data.courses || []);
      } catch {
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, isEnrolled: true, progress: 0 } : c))
        );
      }
    } catch {
      // silent
    } finally {
      setEnrollingId(null);
    }
  };

  const enrolledCourses = useMemo(() => {
    return courses.filter((c) => c.isEnrolled || c.progress > 0);
  }, [courses]);

  const filteredRoadmaps = useMemo(() => {
    return CAREER_ROADMAPS.filter((rm) => {
      if (activeCategory !== "all" && rm.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rm.title.toLowerCase().includes(q) ||
          rm.description.toLowerCase().includes(q) ||
          rm.steps.some((s) => s.title.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* 1. Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Systematic Engineering Curriculum
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Career Roadmaps &amp; Course Tracks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Master engineering step-by-step with strictly sequenced prerequisite roadmaps.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="size-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roadmaps or technologies..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-sans"
          />
        </div>
      </div>

      {/* 2. SECTION A: MY ENROLLED COURSES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              My Active Enrolled Courses ({enrolledCourses.length})
            </h2>
          </div>
          {enrolledCourses.length === 0 && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs font-mono">
              No Active Enrollment
            </Badge>
          )}
        </div>

        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((c) => (
              <Card
                key={c.id}
                className="bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 transition-all rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
              >
                <CardHeader className="p-4 pb-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                      Active Student
                    </Badge>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {Math.round(c.progress || 0)}% Completed
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-white line-clamp-1">{c.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-400 line-clamp-2">{c.description}</CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <Progress value={c.progress || 0} className="h-1.5 bg-slate-800">
                    <ProgressTrack>
                      <ProgressIndicator className="bg-emerald-500" />
                    </ProgressTrack>
                  </Progress>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {c.completedLessons || 0} / {c.totalLessons || 0} Lessons
                    </span>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-7 px-3 gap-1.5 cursor-pointer"
                      render={<Link href={`/dashboard/courses/${c.slug}`} />}
                    >
                      <PlayIcon className="size-3 fill-current" />
                      Continue ▶
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-500/20 text-center space-y-3">
            <SparklesIcon className="size-8 text-sky-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Choose Your Primary Career Track Below</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              You are not enrolled in any course yet. Select a structured roadmap below (e.g. Frontend, Backend, Android, or Full-Stack) to begin your step-by-step learning journey.
            </p>
          </div>
        )}
      </div>

      {/* 3. SECTION B: CATEGORY FILTER TABS */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveCategory(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-sky-600 text-white shadow-md shadow-sky-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. SECTION C: STRUCTURED SEQUENTIAL CAREER ROADMAPS */}
        <div className="space-y-6">
          {filteredRoadmaps.map((roadmap) => (
            <div
              key={roadmap.id}
              className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl"
            >
              <div className="border-b border-slate-800/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <LayersIcon className="size-4 text-sky-400" />
                    {roadmap.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">{roadmap.description}</p>
                </div>
                <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-300 font-mono w-fit">
                  Sequential Progression
                </Badge>
              </div>

              {/* Steps Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {roadmap.steps.map((step) => {
                  const matchedCourse = courses.find((c) => c.slug === step.matchSlug || c.title.toLowerCase().includes(step.title.toLowerCase().slice(0, 15)));
                  const isEnrolled = matchedCourse?.isEnrolled;

                  return (
                    <div
                      key={step.stepNumber}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isEnrolled
                          ? "bg-slate-950 border-emerald-500/60 ring-1 ring-emerald-500/30"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex size-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                            0{step.stepNumber}
                          </span>
                          <Badge className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0">
                            {step.badge}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-white font-mono line-clamp-1">
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      {matchedCourse ? (
                        <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500">
                            {matchedCourse.totalLessons || "10+"} Lessons
                          </span>
                          {isEnrolled ? (
                            <Button
                              size="sm"
                              className="h-6 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-bold cursor-pointer"
                              render={<Link href={`/dashboard/courses/${matchedCourse.slug}`} />}
                            >
                              Learn ▶
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={enrollingId === matchedCourse.id}
                              onClick={() => handleEnrollCourse(matchedCourse.id)}
                              className="h-6 px-2.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold cursor-pointer"
                            >
                              {enrollingId === matchedCourse.id ? "..." : "+ Enroll"}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-850">
                          <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400">
                            Roadmap Included
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
