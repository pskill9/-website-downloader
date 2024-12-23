#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

interface DownloadWebsiteArgs {
  url: string;
  outputPath?: string;
}

const isValidDownloadArgs = (args: any): args is DownloadWebsiteArgs =>
  typeof args === 'object' &&
  args !== null &&
  typeof args.url === 'string' &&
  (args.outputPath === undefined || typeof args.outputPath === 'string');

class WebsiteDownloaderServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'website-downloader',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'download_website',
          description: 'Download an entire website using wget',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL of the website to download',
              },
              outputPath: {
                type: 'string',
                description: 'Path where the website should be downloaded (optional, defaults to current directory)',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'download_website') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      if (!isValidDownloadArgs(request.params.arguments)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid download arguments'
        );
      }

      const { url, outputPath = process.cwd() } = request.params.arguments;

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
          '--level=inf',             // Infinite recursion depth
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
        
        return {
          content: [
            {
              type: 'text',
              text: `Website downloaded successfully to ${outputPath}\n\nOutput:\n${stdout}\n${stderr}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error downloading website: ${error.message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Website Downloader MCP server running on stdio');
  }
}

const server = new WebsiteDownloaderServer();
server.run().catch(console.error);
