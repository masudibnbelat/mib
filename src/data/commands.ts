export interface Command {
  command: string;
  result?: string;
}

export const COMMANDS: Command[] = [
  {
    command: "whoami",
    result:
      "Masud ibn Belat\nMERN Stack / Full Stack Developer\nPassionate about building dynamic and scalable web applications",
  },
  {
    command: "cat skills/languages.txt",
    result:
      "Languages:\n├── JavaScript       [Master]\n├── TypeScript       [Master]\n├── Python           [Master]\n└── Golang           [Beginner]",
  },
  {
    command: "cat skills/frontend.txt",
    result:
      "Frontend Technologies:\n├── CSS Frameworks\n│   ├── Bootstrap        [Master]\n│   └── Tailwind CSS     [Master]\n├── JavaScript Ecosystem\n│   ├── JavaScript (ES6+)[Master]\n│   ├── TypeScript       [Master]\n│   └── React.js         [Master]\n├── Animation\n│   └── Framer Motion    [Master]\n└── Frameworks\n    └── Next.js          [Master]",
  },
  {
    command: "cat skills/backend.txt",
    result:
      "Backend Technologies:\n├── Runtime & Frameworks\n│   ├── Node.js          [Master]\n│   └── Express.js       [Master]\n├── Frameworks\n│   └── Next.js          [Master]\n├── Databases\n│   └── MongoDB          [Intermediate]\n├── Authentication\n│   └── JWT              [Master]\n└── Cloud Services\n    └── Firebase         [Intermediate]",
  },
  {
    command: "ls tools/",
    result:
      "git        github     npm        yarn       bun\nvscode     zed        linux      arch-linux\nfigma      photoshop  gimp       inkscape\nvercel     netlify    surge      firebase",
  },
  {
    command: "cat skills/design.txt",
    result:
      "Design Tools:\n├── Figma            [Master]\n├── Photoshop        [Intermediate]\n├── GIMP             [Intermediate]\n└── Inkscape         [Beginner]",
  },
  {
    command: "cat skills/deployment.txt",
    result:
      "Deployment Platforms:\n├── Vercel           [Master]\n├── Firebase         [Intermediate]\n├── Netlify          [Master]\n└── Surge            [Master]",
  },
  {
    command: "npx create-next-app@latest my-app",
    result:
      "✔ Would you like to use TypeScript? … Yes\n✔ Would you like to use ESLint? … Yes\n✔ Would you like to use Tailwind CSS? … Yes\n✔ Would you like your code inside a `src/` directory? … Yes\n✔ Would you like to use App Router? (recommended) … Yes\n✔ Would you like to use Turbopack for `next dev`? … No\n✔ Would you like to customize the import alias? … No\n\nCreating a new Next.js app in /home/mib/my-app...\n\n✓ Initializing project with template: default\n✓ Installing dependencies...\n\nSuccess! Created my-app at /home/mib/my-app",
  },
  {
    command: "npm i express cors dotenv mongoose",
    result:
      "added 57 packages, and audited 58 packages in 3s\n\n7 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities",
  },
  {
    command: "git status",
    result:
      'On branch main\nYour branch is up to date with \'origin/main\'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n\tmodified:   src/components/Terminal.tsx\n\nno changes added to commit (use "git add" and/or "git commit -a")',
  },
  {
    command: "npm run dev",
    result:
      "  ▲ Next.js 15.3.2\n  - Local:        http://localhost:3000\n  - Network:      use --hostname to expose\n  - Environments: .env.local\n\n ✓ Starting...\n ✓ Ready in 847ms",
  },
  {
    command: "cat about.txt",
    result:
      "Hi! I'm Masud ibn Belat 👋\n\nI specialize in building modern web applications using the MERN stack.\nMy expertise spans across:\n\n• Frontend: React, Next.js, TypeScript, Tailwind CSS\n• Backend: Node.js, Express, MongoDB\n• Design: Figma, Photoshop, GIMP\n• Tools: Git, npm, Vite, VS Code, Arch Linux\n• Deployment: Vercel, Netlify, Surge, Firebase\n\nCurrently exploring new technologies and always learning!",
  },
];
