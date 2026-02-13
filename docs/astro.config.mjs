import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
// @ts-check
import { defineConfig } from 'astro/config';
import remarkMermaid from 'remark-mermaidjs';
import starlightLlmsTxt from 'starlight-llms-txt';

const sidebar = [
  {
    label: 'Overview',
    link: '/',
    slug: 'index',
  },
  { label: 'Quickstart', slug: 'quickstart' },
  {
    label: 'Packages',
    items: [
      { label: 'agents-core', slug: 'packages/agents-core' },
      { label: 'agent', slug: 'packages/agent' },
    ],
  },
  {
    label: 'Agent Concepts',
    items: [
      { label: 'Session', slug: 'concepts/session' },
      { label: 'Agent Loop', slug: 'concepts/agent-loop' },
      { label: 'Built-in Tools', slug: 'concepts/built-in-tools' },
      { label: 'Hooks', slug: 'concepts/hooks' },
      { label: 'Skills', slug: 'concepts/skills' },
      { label: 'Subagents', slug: 'concepts/subagents' },
    ],
  },
  {
    label: 'Guides',
    items: [
      { label: 'CLI', slug: 'guides/cli' },
      { label: 'Configuration', slug: 'guides/configuration' },
      { label: 'Tool Calling', slug: 'guides/tool-calling' },
      { label: 'Streaming', slug: 'guides/streaming' },
    ],
  },
];

// https://astro.build/config
export default defineConfig({
  site: 'https://philschmid.github.io',
  base: '/ia-agents',

  integrations: [
    starlight({
      title: 'IA Agents',
      favicon: '/favicon.svg',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/philschmid/ia-agents',
        },
      ],
      sidebar,
      components: {
        SiteTitle: './src/components/Title.astro',
        PageTitle: './src/components/PageTitle.astro',
        PageSidebar: './src/components/PageSidebar.astro',
      },
      customCss: ['./src/styles/global.css'],
      expressiveCode: {
        themes: ['houston', 'light-plus'],
      },
      plugins: [
        starlightLlmsTxt({
          projectName: 'Gemini Interactions API',
          customSets: [
            {
              label: 'Guides',
              description: 'Guides for using the Gemini Interactions API',
              paths: ['guides/**'],
            },
            {
              label: 'Reference',
              description: 'API reference for the Gemini Interactions API',
              paths: ['reference/**'],
            },
          ],
        }),
      ],
    }),
  ],

  markdown: {
    remarkPlugins: [
      [
        remarkMermaid,
        {
          mermaidConfig: {
            theme: 'dark',
            themeVariables: {
              background: 'transparent',
              primaryColor: '#4f46e5',
              primaryTextColor: '#e5e7eb',
              primaryBorderColor: '#6366f1',
              lineColor: '#9ca3af',
              secondaryColor: '#374151',
              tertiaryColor: '#1f2937',
            },
          },
        },
      ],
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
