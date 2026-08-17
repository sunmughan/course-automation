export const modernUiLibrariesCourse = {
  "title": "Modern UI Libraries, Tailwind CSS v4 & Next.js 15 App Router",
  "description": "Mastering Tailwind CSS v4, Shadcn/UI, React Bits, 21st.dev, Aceternity UI, Framer Motion animations, Zod validation, and Next.js 15 Server Components.",
  "slug": "modern-ui-libraries-tailwind-nextjs15",
  "stream": "frontend",
  "imageUrl": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
  "order": 1,
  "modules": [
    {
      "title": "Phase 1: Tailwind CSS v4 & Modern Component Libraries",
      "description": "Tailwind CSS v4 engine, Shadcn/UI primitives, React Bits, 21st.dev, Animata, and HyperUI component libraries.",
      "slug": "phase-1-tailwind-shadcn-ui-libraries",
      "topics": [
        {
          "title": "Shadcn/UI & Copy-Paste Component Architecture",
          "description": "Radix UI headless primitives, Tailwind styling, `components.json`, accessibility, and creating custom design systems.",
          "slug": "shadcn-ui-component-architecture",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Why Copy-Paste UI (Shadcn)",
              "description": "Owning the component code vs being locked into rigid npm packages."
            },
            {
              "title": "Radix UI Primitives & Accessibility",
              "description": "Keyboard navigation, ARIA attributes, focus traps, and screen-reader support."
            }
          ],
          "examples": [
            {
              "title": "Shadcn Button Component",
              "description": "Customizable Button primitive",
              "starterCode": "import * as React from 'react';\nimport { Slot } from '@radix-ui/react-slot';\nimport { cva } from 'class-variance-authority';\n\nconst buttonVariants = cva(\n  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all',\n  {\n    variants: {\n      variant: {\n        default: 'bg-sky-600 text-white hover:bg-sky-500',\n        destructive: 'bg-rose-600 text-white hover:bg-rose-500',\n        outline: 'border border-slate-800 bg-slate-950 text-slate-200'\n      }\n    },\n    defaultVariants: { variant: 'default' }\n  }\n);",
              "solutionCode": "import * as React from 'react';\nimport { Slot } from '@radix-ui/react-slot';\nimport { cva } from 'class-variance-authority';\n\nconst buttonVariants = cva(\n  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all',\n  {\n    variants: {\n      variant: {\n        default: 'bg-sky-600 text-white hover:bg-sky-500',\n        destructive: 'bg-rose-600 text-white hover:bg-rose-500',\n        outline: 'border border-slate-800 bg-slate-950 text-slate-200'\n      }\n    },\n    defaultVariants: { variant: 'default' }\n  }\n);"
            }
          ],
          "exercises": [
            {
              "title": "Create a CVA Variant",
              "description": "Define variants",
              "starterCode": "const v = cva('')",
              "solutionCode": "const v = cva('')",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "Shadcn Architecture",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Shadcn/UI & Copy-Paste Component Architecture",
            "content": "Shadcn UI gives you 100% control over every line of your UI components.",
            "explanation": "Shadcn has revolutionized modern frontend development."
          }
        },
        {
          "title": "Creative UI Ecosystem (React Bits, 21st.dev, Aceternity UI)",
          "description": "Where to find world-class modern UI components: React Bits, 21st.dev, Aceternity UI, Animata, HyperUI, and Framer Motion micro-interactions.",
          "slug": "creative-ui-ecosystem-react-bits-21stdev",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "Interactive Motion Components",
              "description": "Spotlight cards, text animations, magnetic buttons, and glassmorphism."
            },
            {
              "title": "Component Catalog Curation",
              "description": "Evaluating performance, bundle size, and accessibility when integrating third-party UI blocks."
            }
          ],
          "examples": [
            {
              "title": "Framer Motion Hover Card",
              "description": "Interactive animated card",
              "starterCode": "import { motion } from 'framer-motion';\n\nexport function ShinyCard({ title, desc }) {\n  return (\n    <motion.div\n      whileHover={{ scale: 1.02, y: -4 }}\n      transition={{ type: 'spring', stiffness: 400, damping: 25 }}\n      className='p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50'\n    >\n      <h3 className='text-base font-bold text-white'>{title}</h3>\n      <p className='text-xs text-slate-400 mt-1'>{desc}</p>\n    </motion.div>\n  );\n}",
              "solutionCode": "import { motion } from 'framer-motion';\n\nexport function ShinyCard({ title, desc }) {\n  return (\n    <motion.div\n      whileHover={{ scale: 1.02, y: -4 }}\n      transition={{ type: 'spring', stiffness: 400, damping: 25 }}\n      className='p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50'\n    >\n      <h3 className='text-base font-bold text-white'>{title}</h3>\n      <p className='text-xs text-slate-400 mt-1'>{desc}</p>\n    </motion.div>\n  );\n}"
            }
          ],
          "exercises": [
            {
              "title": "Create Motion Card",
              "description": "Framer motion",
              "starterCode": "<motion.div />",
              "solutionCode": "<motion.div />",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "UI Motion Flow",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Creative UI Ecosystem (React Bits, 21st.dev, Aceternity UI)",
            "content": "Modern web apps differentiate themselves with delight, micro-interactions, and visual polish.",
            "explanation": "Modern creative UI libraries elevate apps from functional to award-winning."
          }
        }
      ]
    }
  ]
};
