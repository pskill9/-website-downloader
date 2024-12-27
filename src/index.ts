#!/usr/bin/env node

import { FastMCP, UserError } from 'fastmcp';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execAsync = promisify(exec);

const server = new FastMCP(
  {
    name: 'website-downloader',
    version: '0.1.0',
  },
);

server.addTool({
  name: 'download_website',
  description: 'Download an entire website using wget',
  parameters: z.object({
    url: z.string().url().describe('URL of the website to download'),
    outputPath: z.string().optional().describe('Path where the website should be downloaded (optional, defaults to current directory)'),
    depth: z.number().min(0).optional().describe('Maximum depth level for recursive downloading (optional, defaults to infinite)'),
  }),
  execute: async (args) => {
    const { url, outputPath = process.cwd(), depth } = args;

    try {
      // Check if wget is installed
      await execAsync('which wget');
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error downloading website: ${error.message || 'Unknown error'}`
          },
        ],
        isError: true,
      };
    }

    try {
      // Create wget command with options for downloading website
      const wgetCommand = [
        'wget',
        '--recursive',              // Download recursively
        `--level=${depth !== undefined ? depth : 'inf'}`,  // Recursion depth (infinite if not specified)
        '--page-requisites',       // Get all assets needed to display the page
        '--convert-links',         // Convert links to work locally
        '--adjust-extension',      // Add appropriate extensions to files
        '--span-hosts',            // Include necessary resources from other hosts
        '--domains=' + new URL(url).hostname,  // Restrict to same domain
        '--no-parent',             // Don't follow links to parent directory
        '--directory-prefix=' + outputPath,  // Output directory
        url
      ].join(' ');

      const { stdout, stderr } = await execAsync(wgetCommand);
      
      return `Website downloaded successfully to ${outputPath}\n\nOutput:\n${stdout}\n${stderr}`;
    } catch (error: any) {
      throw new UserError(`Error downloading website: ${error.message || 'Unknown error'}`);
    }
  }
});

server.start({
  transportType: 'stdio',
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});