import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      // You can extend the default theme here if needed in the future
      // For v4, most custom tokens go into a CSS file (@theme)
    },
  },
  plugins: [
    require("tailwindcss-animate"), // For Shadcn UI animations
  ],
};

export default {
  // Config for Tailwind CSS v4 Alpha
  // Content paths will be managed by the framework (Next.js)
  // or you can specify them if needed: content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  ...config,
  content: [ // Add this content array for Tailwind to scan your files
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // If you decide to use a src directory later
  ],
} satisfies Config; 